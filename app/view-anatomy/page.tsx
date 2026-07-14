'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle, RefreshCw, Layers,
  Mic, MicOff, Clock, User, Thermometer, FileText, ChevronDown, Zap, Search
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { InteractiveAnatomyViewer, invalidateFnRef, ORGAN_MAP } from '@/components/interactive-anatomy-viewer'
import { useAppContext } from '@/components/AppContext'

export default function ViewAnatomyPage() {
  const { activePatient } = useAppContext()
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split')
  const isSplittedRef = useRef<boolean>(false) // High performance split toggle Ref
  
  // Patient symptom input fields
  const [age, setAge] = useState<number>(activePatient?.age || 38)
  const [sex, setSex] = useState<'Male' | 'Female'>((activePatient?.gender as 'Male' | 'Female') || 'Male')
  const [duration, setDuration] = useState<string>('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState<string>(activePatient?.symptoms || '')

  // Analysis result states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [recommendedInvestigations, setRecommendedInvestigations] = useState<string[]>([])
  const [redFlag, setRedFlag] = useState<boolean>(false)
  const [highlightedMeshNames, setHighlightedMeshNames] = useState<string[]>([])
  
  // Clinically mapped organs matching active symptom analysis
  const [affectedOrganIds, setAffectedOrganIds] = useState<string[]>([])
  const [affectedAnatomyList, setAffectedAnatomyList] = useState<Array<{label: string, mesh_id: string}>>([])
  const [conditionsByOrgan, setConditionsByOrgan] = useState<Record<string, { condition: string; reasoning: string; severity: string }>>({})

  const [selectedOrgan, setSelectedOrgan] = useState<{
    organ: string; condition?: string; reasoning?: string; severity?: string
  } | null>(null)

  useEffect(() => {
    if (!symptomsInput.trim()) {
      setHighlightedMeshNames([])
      setAffectedOrganIds([])
      setConditionsByOrgan({})
      setPossibleConditions([])
      setRedFlag(false)
      setIsSymptomSubmitted(false)
    }
  }, [symptomsInput])

  const handleOrganClick = (organ: string, condition?: string, reasoning?: string, sev?: string) => {
    setSelectedOrgan({ organ, condition, reasoning, severity: sev })
  }

  // ── Voice Recording (Web Speech API) ─────────────────────────────────────
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [micError, setMicError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const toggleRecording = useCallback(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicError('Voice input not supported in this browser. Use Chrome or Edge.')
      return
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop()
      setIsRecording(false)
      setRecordingTime(0)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      return
    }

    setMicError(null)
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    let finalTranscript = ''

    recognition.onstart = () => {
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
          setSymptomsInput(prev => (prev ? prev.trimEnd() + ' ' : '') + finalTranscript.trim())
          finalTranscript = ''
        } else {
          interim = transcript
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Allow mic in browser settings.')
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Try again.')
      } else {
        setMicError(`Recording error: ${event.error}`)
      }
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }

    recognition.start()
  }, [isRecording])

  // Auto-fill and auto-analyze when coming from Patient Workspace via URL params or global Context
  const searchParams = useSearchParams()
  useEffect(() => {
    let shouldAnalyze = false;
    
    // Check URL params first (for external links)
    const urlSymptoms = searchParams.get('symptoms')
    const urlAge = searchParams.get('age')
    const urlSex = searchParams.get('sex')
    
    if (urlSymptoms) {
      setSymptomsInput(urlSymptoms)
      if (urlAge) setAge(parseInt(urlAge) || 38)
      if (urlSex === 'Female' || urlSex === 'Male') setSex(urlSex)
      shouldAnalyze = true
    } else if (activePatient && activePatient.symptoms) {
      // Use global context if no URL params
      setSymptomsInput(activePatient.symptoms)
      setAge(activePatient.age || 38)
      if (activePatient.gender) setSex(activePatient.gender)
      shouldAnalyze = true
    }

    if (shouldAnalyze) {
      // Auto-trigger analysis after a short delay for page to mount
      setTimeout(() => {
        document.getElementById('analyze-btn')?.click()
      }, 800)
    }
  }, [searchParams, activePatient]) 
  // Anatomy State
  const [anatomyList, setAnatomyList] = useState<Array<{label: string, description: string, severity: string}>>([])
  const [validatedLabels, setValidatedLabels] = useState<Set<string>>(new Set())
  const [isSymptomSubmitted, setIsSymptomSubmitted] = useState(false)
  // Set split status text in the DOM directly for instant zero-lag feedback
  const updateSplitStatusHUD = () => {
    const statusTextEl = document.getElementById('split-status-text')
    if (statusTextEl) {
      if (viewMode === 'single') {
        statusTextEl.innerText = 'Centered Single Layer View'
      } else {
        statusTextEl.innerText = isSplittedRef.current 
          ? 'Split Mode Active (Click human to Merge)' 
          : 'Standing Human (Click human to Split)'
      }
    }
  }

  // Model click handler to toggle split-out states instantly
  const handleModelClick = () => {
    if (viewMode === 'split') {
      isSplittedRef.current = !isSplittedRef.current
      updateSplitStatusHUD()
    }
  }

  // Clear/Reset symptoms and model state
  const handleClear = () => {
    setSymptomsInput('')
    setPossibleConditions([])
    setRedFlag(false)
    setAnatomyList([])
    setValidatedLabels(new Set())
    setRecommendedInvestigations([])
    setErrorMsg(null)
    setSelectedOrgan(null)
    isSplittedRef.current = false
    setIsSymptomSubmitted(false)
    updateSplitStatusHUD()
  }

  // Handle clinical analysis
  const handleAnalyze = async () => {
    if (!symptomsInput.trim()) return
    setIsLoading(true)
    setErrorMsg(null)
    setPossibleConditions([])
    setRedFlag(false)
    setHighlightedMeshNames([])
    setAffectedOrganIds([])
    setAffectedAnatomyList([])
    setConditionsByOrgan({})
    setRecommendedInvestigations([])

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, sex, duration, severity, symptoms: symptomsInput })
      })

      if (!response.ok) {
        let errorMsg = 'API server error.'
        try {
          const errData = await response.json()
          if (errData.error) errorMsg = errData.error
        } catch (_) {}
        throw new Error(errorMsg)
      }
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // Map new differential_diagnoses strings to the UI structure and sort by confidence
      const diagnoses = (data.differential_diagnoses || [])
        .map((d: any) => ({
          name: d.condition || 'Unknown Condition',
          confidence: typeof d.confidence === 'number' ? d.confidence : 0,
          reasoning: d.reasoning || 'AI-generated clinical differential.'
        }))
        .sort((a: any, b: any) => b.confidence - a.confidence)

      setPossibleConditions(diagnoses)
      setRecommendedInvestigations(data.recommended_investigations || [])
      setRedFlag(false)

      const rawAnatomy = data.affected_anatomy || []
      const newList: Array<{label: string, description: string, severity: string}> = []
      const uniqueLabels = new Set<string>()

      const newAffectedIds: string[] = []
      const newConditionsByOrgan: Record<string, any> = {}

      rawAnatomy.forEach((item: any) => {
        if (!item.label || item.label === "Unable to determine") return
        if (!uniqueLabels.has(item.label)) {
          uniqueLabels.add(item.label)
          newList.push({
            label: item.label,
            description: item.description || '',
            severity: severity
          })

          // Extract primary diagnosis for reasoning
          const bestDiag = data.differential_diagnoses && data.differential_diagnoses.length > 0 
            ? data.differential_diagnoses[0] 
            : null

          // Robust synonym matching
          const term = item.label.toLowerCase()
          let matchedIds: string[] = []
          
          // 1. Dictionary Match via ORGAN_MAP
          for (const [key, ids] of Object.entries(ORGAN_MAP)) {
             if (term.includes(key)) matchedIds.push(...ids)
          }

          // 2. Exact word tokens (so FBX matches specific bones/muscles like "patella", "femur", "biceps")
          const tokens = term.split(/[\s-]+/)
          tokens.forEach(t => {
             const clean = t.replace(/[^a-z0-9]/g, '')
             if (clean.length > 2) matchedIds.push(clean) // minimum 3 chars to avoid noise like 'of', 'left'
          })

          // 3. Full sanitized term
          matchedIds.push(term.replace(/[^a-z0-9]/g, '_'))
          
          // 4. Force skeleton/muscle systems for broad queries so they show up at all
          if (term.includes('bone') || term.includes('spine') || term.includes('joint')) {
             matchedIds.push('skeleton')
          }
          if (term.includes('muscle') || term.includes('tendon') || term.includes('ligament')) {
             matchedIds.push('muscles')
          }
          if (term.includes('vein') || term.includes('artery') || term.includes('blood')) {
             matchedIds.push('cardiovascular')
          }

          // Deduplicate and update state maps
          const uniqueMatched = Array.from(new Set(matchedIds))
          uniqueMatched.forEach(id => {
             if (!newAffectedIds.includes(id)) newAffectedIds.push(id)
             if (!newConditionsByOrgan[id]) {
                newConditionsByOrgan[id] = {
                   condition: bestDiag ? bestDiag.condition : item.label,
                   reasoning: bestDiag ? bestDiag.reasoning : item.description,
                   severity: severity
                }
             }
          })
        }
      })

      setAnatomyList(newList)
      setAffectedOrganIds(newAffectedIds)
      setConditionsByOrgan(newConditionsByOrgan)
      setValidatedLabels(new Set(newList.map(item => item.label))) // Med-Gemma mapping ensures all labels are anchored
      setIsSymptomSubmitted(prev => !prev) // Toggle to trigger reset in viewer

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnatomyValidated = (labels: string[]) => {
    setValidatedLabels(new Set(labels))
  }

  // Sync splitted mode on top tabs click
  useEffect(() => {
    if (viewMode === 'single') {
      isSplittedRef.current = false
    }
    updateSplitStatusHUD()
  }, [viewMode])

  return (
    <div className="w-full h-screen glass-panel text-gray-100 flex flex-col font-mono text-xs select-none overflow-hidden relative">

      {/* HEADER: Deep Dark Command Header */}
      <div className="bg-[#0b132b] border-b border-white/10 px-4 py-3 z-10 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/scan" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-white/10 transition text-[10px] font-bold text-gray-300 pointer-events-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-blue-950/40"></div>
          <div>
            <h1 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> 
              ABDM Clinician 3D Command Viewer
            </h1>
            <p className="text-[9px] text-on-surface-variant mt-0.5 font-sans font-medium">Physically based medical models. Click body to split/merge anatomical columns.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Split vs Single view toggle tabs */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-white/10">
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-cyan-950/60 border border-cyan-500/30 text-primary shadow-sm' : 'text-on-surface-variant hover:text-slate-400'
              }`}
            >
              Split View
            </button>
            <button 
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'single' ? 'bg-cyan-950/60 border border-cyan-500/30 text-primary shadow-sm' : 'text-on-surface-variant hover:text-slate-400'
              }`}
            >
              Single View
            </button>
          </div>
          <div className="h-4 w-px bg-blue-950/40 mx-1"></div>
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-[9px]">● ABDM SECURE</span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">

        {/* LEFT COLUMN: Patient Symptom Input (22% Width) */}
        <div className="w-[22%] min-w-[280px] bg-surface/40 backdrop-blur-3xl border-r border-primary/20 shadow-2xl p-4 flex flex-col justify-start gap-4 overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          <div className="space-y-4">

            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-xs uppercase text-primary tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Patient Intake Form
              </span>
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-950/30 px-1.5 py-0.5 rounded">● LIVE</span>
            </div>

            <div className="space-y-3 text-[10px]">

              {/* Age, Sex Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-on-surface-variant uppercase text-[9px] font-bold flex items-center gap-1"><User className="w-2.5 h-2.5" /> Age</label>
                  <input
                    type="number"
                    value={age}
                    min={1} max={120}
                    onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-surface-variant/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-on-surface-variant uppercase text-[9px] font-bold">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-surface-variant/50 border border-white/10 rounded px-2 py-1.5 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Duration + Severity */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-on-surface-variant uppercase text-[9px] font-bold flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 3 days"
                    className="w-full bg-surface-variant/50 border border-white/10 rounded px-2.5 py-1.5 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-on-surface-variant uppercase text-[9px] font-bold flex items-center gap-1"><Thermometer className="w-2.5 h-2.5" /> Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-surface-variant/50 border border-white/10 rounded px-2 py-1.5 text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-xs"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Critical">🔴 Critical</option>
                  </select>
                </div>
              </div>

              {/* Quick Symptom Presets */}
              <div className="space-y-1.5">
                <label className="text-on-surface-variant uppercase text-[9px] font-bold flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Quick Fill</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '🫀 Cardiac', text: 'Severe chest pain radiating to the left arm and jaw for 2 hours. Sweating, nausea, shortness of breath. HR 108 bpm, BP 150/95.' },
                    { label: '🫁 Lung', text: 'Persistent cough with blood-streaked sputum for 3 weeks. Evening low-grade fever, night sweats, 6 kg weight loss. SpO2 91%.' },
                    { label: '🧠 Neuro', text: 'Sudden thunderclap headache, neck stiffness, photophobia, vomiting, fever 39.5°C. Confused. Kernig sign positive.' },
                    { label: '🫃 Abdomen', text: 'Pain that started near navel and shifted to lower right abdomen over 2 days. Nausea, fever 38.2°C, rebound tenderness at McBurney point.' },
                    { label: '🦠 Dengue', text: 'High grade fever 103°F for 5 days. Severe retro-orbital headache, muscle and joint pain, petechial rashes on lower limbs.' },
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => setSymptomsInput(p.text)}
                      className="px-2 py-0.5 rounded bg-surface border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 text-[8.5px] font-bold transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms Description with Mic */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-on-surface-variant uppercase text-[9px] font-bold">Symptoms Description *</label>
                  <span className={`text-[8px] font-mono ${ symptomsInput.length > 400 ? 'text-amber-400' : 'text-slate-600'}`}>
                    {symptomsInput.length}/600
                  </span>
                </div>

                {/* Textarea + Mic wrapper */}
                <div className="relative">
                  <textarea
                    rows={8}
                    maxLength={600}
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault()
                        handleAnalyze()
                      }
                    }}
                    placeholder={'Describe patient symptoms in detail...\n\nInclude:\n• Location & radiation of pain\n• Duration & onset\n• Associated symptoms\n• Vital signs if known\n\nCtrl+Enter to submit'}
                    className={`w-full bg-surface-variant/50 border rounded p-2.5 pb-8 text-white outline-none text-xs resize-none leading-relaxed custom-scrollbar font-mono placeholder-slate-700 transition-colors ${
                      isRecording
                        ? 'border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                        : 'border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50'
                    }`}
                  />

                  {/* Mic button inside textarea bottom-right */}
                  <button
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                    className={`absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer border ${
                      isRecording
                        ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-primary hover:border-cyan-500/40 hover:bg-cyan-950/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Recording status bar */}
                {isRecording && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-red-950/30 border border-red-500/30 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="text-[9px] text-red-400 font-bold font-mono uppercase tracking-wider">Recording... speak clearly</span>
                    <span className="ml-auto text-[8px] text-red-400/60 font-mono">{recordingTime}s</span>
                  </div>
                )}
                {micError && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/30 border border-amber-500/30 rounded text-amber-400 text-[8.5px]">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {micError}
                  </div>
                )}

                {/* Mic hint when idle */}
                {!isRecording && !micError && (
                  <p className="text-[8px] text-slate-600 font-sans">
                    🎤 Click mic to dictate symptoms — or type. Ctrl+Enter to submit.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4 shrink-0">
            {/* SUBMIT BUTTON - Full width, prominent */}
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={isLoading || !symptomsInput.trim()}
              className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg border ${
                isLoading
                  ? 'bg-cyan-950/60 border-cyan-500/30 text-primary animate-pulse'
                  : symptomsInput.trim()
                  ? 'bg-primary/10 hover:bg-primary/20 border border-primary text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)] hud-glow'
                  : 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                  DeepSeek Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit &amp; Analyze Symptoms
                </>
              )}
            </button>

            {/* Clear button */}
            <button
              onClick={handleClear}
              className="w-full py-1.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-on-surface-variant hover:text-on-surface font-bold uppercase text-[9px] tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Clear &amp; Reset
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: 3D Visualization Viewport (53% Width) */}
        <InteractiveAnatomyViewer 
          affectedOrganIds={affectedOrganIds}
          conditionsByOrgan={conditionsByOrgan}
          highlightedMeshNames={highlightedMeshNames}
          onOrganClick={handleOrganClick}
          viewMode={viewMode}
          setViewMode={setViewMode}
          // Legacy props that may still be required if I didn't clean them up in InteractiveAnatomyViewer
          anatomyList={anatomyList}
          onAnatomyValidated={handleAnatomyValidated}
          isSymptomSubmitted={isSymptomSubmitted}
        />

        {/* RIGHT COLUMN: Results Panel (20% Width - Compact) */}
        {(possibleConditions.length > 0 || isLoading) && (
          <div className="w-[20%] min-w-[260px] bg-surface/40 backdrop-blur-3xl border-l border-primary/20 shadow-2xl p-3.5 flex flex-col overflow-y-auto custom-scrollbar shrink-0 shadow-sm transition-all">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-3">
              <span className="font-bold text-[10px] uppercase text-primary tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> AI Clinical Results
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-[9px] text-cyan-400 font-mono uppercase animate-pulse">Running Diagnostic AI...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {redFlag && (
                  <div className="bg-red-950/40 border border-red-500/50 p-2.5 rounded-lg flex items-start gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">Medical Emergency</h4>
                      <p className="text-[8px] text-red-200/80 leading-relaxed">Symptoms indicate a potentially life-threatening condition requiring immediate medical attention.</p>
                    </div>
                  </div>
                )}

                {/* NEW: Affected Anatomy Section */}
                <div className="mb-3 bg-slate-900/40 rounded-xl p-2.5 border border-blue-900/30">
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-blue-400" /> Affected Anatomy
                  </h3>
                  
                  {anatomyList.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {anatomyList.map((item, idx) => {
                        const isFound = validatedLabels.has(item.label)
                        return (
                          <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isFound ? 'text-cyan-400' : 'text-slate-500 line-through'}`}>
                                {item.label}
                              </span>
                              {!isFound && (
                                <span className="text-[7.5px] bg-red-950/50 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-mono uppercase">
                                  Mesh not found
                                </span>
                              )}
                              {isFound && (
                                <span className="text-[7.5px] bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded font-mono uppercase">
                                  Validated
                                </span>
                              )}
                            </div>
                            <p className={`text-[8.5px] ${isFound ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                              {item.description}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500 italic px-1.5">No specific anatomy detected.</div>
                  )}
                </div>

                {/* Differential Diagnoses */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest border-b border-white/5 pb-1">Differential Diagnoses</h3>
                  {possibleConditions.map((cond, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/10 rounded-xl p-2.5 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h4 className="text-[10px] font-bold text-white leading-tight">{cond.name}</h4>
                        <span className={`text-[8px] font-black px-1 py-0.5 rounded border tracking-wider shrink-0 ${
                          cond.confidence >= 80 ? 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30' :
                          cond.confidence >= 50 ? 'bg-amber-950/50 text-amber-400 border-amber-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-600'
                        }`}>
                          {cond.confidence}%
                        </span>
                      </div>
                      <p className="text-[8.5px] text-slate-400 leading-relaxed font-sans">{cond.reasoning}</p>
                    </div>
                  ))}
                </div>

                {/* Recommended Investigations */}
                {recommendedInvestigations.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <h3 className="text-[9px] uppercase font-bold text-on-surface-variant tracking-widest border-b border-white/5 pb-1">Recommended Investigations</h3>
                    <div className="flex flex-wrap gap-1">
                      {recommendedInvestigations.map((inv, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-blue-950/30 border border-blue-500/20 rounded text-[8.5px] font-medium text-blue-200">
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-6 p-2 bg-slate-900/50 border border-slate-800 rounded-lg flex gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <p className="text-[7.5px] text-slate-500 font-sans leading-relaxed">
                    <strong>DISCLAIMER:</strong> AI decision support. Not a confirmed diagnosis. Always exercise clinical judgment and perform testing.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Detail Modal Overlay */}
      {selectedOrgan && (
        <div className="absolute inset-0 z-50 flex items-center justify-center glass-panel backdrop-blur-sm p-4">
          <div className="bg-surface-variant/90 border border-primary/30 p-6 rounded-xl max-w-md w-full shadow-[0_0_30px_rgba(0,255,255,0.15)] relative">
            <button 
              onClick={() => setSelectedOrgan(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-primary mb-2 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {selectedOrgan.organ.replace('_', ' ')}
            </h2>
            
            {selectedOrgan.condition ? (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <span className="text-[10px] uppercase text-primary font-bold tracking-widest block mb-1">Detected Anomaly</span>
                  <p className="text-on-surface text-sm font-medium">{selectedOrgan.condition}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest block mb-1">Clinical Reasoning</span>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{selectedOrgan.reasoning}</p>
                </div>
                {selectedOrgan.severity && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-widest block mb-1">Severity</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      selectedOrgan.severity.toLowerCase() === 'critical' ? 'bg-red-950/50 text-red-400 border border-red-500/30' :
                      selectedOrgan.severity.toLowerCase() === 'high' ? 'bg-orange-950/50 text-orange-400 border border-orange-500/30' :
                      'bg-yellow-950/50 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {selectedOrgan.severity}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm mt-4">No specific anomalies detected in this region based on the current symptoms.</p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
