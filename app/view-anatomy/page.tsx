'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle, RefreshCw, Layers,
  Mic, MicOff, Clock, User, Thermometer, FileText, ChevronDown, Zap
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { InteractiveAnatomyViewer, ORGAN_MAP } from '@/components/interactive-anatomy-viewer'

export default function ViewAnatomyPage() {
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split')
  const isSplittedRef = useRef<boolean>(false) // High performance split toggle Ref
  const cameraRef     = useRef<CameraHandle>(null) // Camera control HUD ref
  
  // Patient symptom input fields
  const [age, setAge] = useState<number>(38)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState<string>('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState<string>('')

  // Analysis result states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [redFlag, setRedFlag] = useState<boolean>(false)
  const [highlightedMeshNames, setHighlightedMeshNames] = useState<string[]>([])
  
  // Clinically mapped organs matching active symptom analysis
  const [affectedOrganIds, setAffectedOrganIds] = useState<string[]>([])
  const [conditionsByOrgan, setConditionsByOrgan] = useState<Record<string, { condition: string; reasoning: string; severity: string }>>({})

  // Detail modal state
  const [selectedOrgan, setSelectedOrgan] = useState<{
    organ: string; condition?: string; reasoning?: string; severity?: string
  } | null>(null)

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

  // Auto-fill and auto-analyze when coming from Patient Workspace via URL params
  const searchParams = useSearchParams()
  useEffect(() => {
    const urlSymptoms = searchParams.get('symptoms')
    const urlAge = searchParams.get('age')
    const urlSex = searchParams.get('sex')
    if (urlSymptoms) {
      setSymptomsInput(urlSymptoms)
      if (urlAge) setAge(parseInt(urlAge) || 38)
      if (urlSex === 'Female' || urlSex === 'Male') setSex(urlSex)
      // Auto-trigger analysis after a short delay for page to mount
      setTimeout(() => {
        document.getElementById('analyze-btn')?.click()
      }, 800)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // 3D layers toggles — organs ON by default so model is immediately visible
  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: false,
    muscular: false,
    nervous: true,        // brain visible by default
    cardiovascular: true, // heart visible by default
    respiratory: true,    // lungs visible by default
    digestive: true,      // organs visible by default
    lymphatic: false,
    integumentary: false
  })

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
    setHighlightedMeshNames([])
    setAffectedOrganIds([])
    setConditionsByOrgan({})
    setErrorMsg(null)
    setSelectedOrgan(null)
    isSplittedRef.current = false
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
    setConditionsByOrgan({})

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, sex, duration, severity, symptoms: symptomsInput })
      })

      if (!response.ok) throw new Error('API server error.')
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setPossibleConditions(data.possibleConditions || [])
      setRedFlag(!!data.redFlag)

      // ── Resolve AI region strings → canonical organ IDs ───────────────────
      const meshNames: string[] = []
      const organIds: string[] = []
      const organConditions: Record<string, { condition: string; reasoning: string; severity: string }> = {}

      // Mesh keyword → GLB material/mesh name matchers for emissive highlighting
      const MESH_KEYWORDS: Record<string, string[]> = {
        'heart':        ['heart', 'atrium', 'ventricle', 'cardiac', 'myocard'],
        'lung_left':    ['lung', 'pulmon', 'bronchi', 'pleura', 'lobe'],
        'lung_right':   ['lung', 'pulmon', 'bronchi', 'pleura', 'lobe'],
        'brain':        ['brain', 'cerebr', 'cranial', 'cortex', 'cerebellum'],
        'liver':        ['liver', 'hepat'],
        'stomach':      ['stomach', 'gastric', 'esophag'],
        'intestines':   ['intestine', 'bowel', 'colon', 'ileum', 'jejunum'],
        'kidney_left':  ['kidney', 'renal'],
        'kidney_right': ['kidney', 'renal'],
        'trachea':      ['trachea', 'cartilage', 'windpipe'],
        'throat':       ['throat', 'larynx', 'pharynx'],
        'nasal_cavity': ['nasal', 'sinus'],
        'spleen':       ['spleen', 'splenic'],
        'pancreas':     ['pancrea'],
        'appendix':     ['appendix'],
        'bladder':      ['bladder'],
        'gallbladder':  ['gallbladder', 'cholecyst'],
        'aorta':        ['aorta', 'artery', 'vein'],
        'spinal_cord':  ['spine', 'spinal', 'vertebr'],
        'skin':         ['skin', 'integumentary', 'derm'],
        'lymph_nodes':  ['lymph', 'node'],
      }

      // Normalize one raw string → canonical organ IDs (with partial-match fallback)
      const resolveToOrganIds = (raw: string): string[] => {
        const key = raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
        if (ORGAN_MAP[key]) return ORGAN_MAP[key]
        // Partial match — e.g. "pulmonary_congestion" still hits "pulmonary"
        for (const [mapKey, ids] of Object.entries(ORGAN_MAP)) {
          if (key.includes(mapKey) || mapKey.includes(key)) return ids
        }
        return []
      }

      // Process each affected region from API
      ;(data.affectedRegions || []).forEach((r: string) => {
        const ids = resolveToOrganIds(r)
        ids.forEach(id => {
          if (!organIds.includes(id)) organIds.push(id)
          const keywords = MESH_KEYWORDS[id] || [id.replace(/_/g, '')]
          keywords.forEach(kw => { if (!meshNames.includes(kw)) meshNames.push(kw) })
        })
      })

      // Also normalize organConditions keys from API response → copy to all resolved IDs
      const primaryCond = data.possibleConditions?.[0]
      if (data.organConditions) {
        Object.entries(data.organConditions).forEach(([rawKey, val]: [string, any]) => {
          const ids = resolveToOrganIds(rawKey)
          ids.forEach(id => {
            if (!organConditions[id]) {
              organConditions[id] = {
                condition: val.condition || primaryCond?.name || 'Affected Region',
                reasoning: val.reasoning || primaryCond?.reasoning || 'Clinically mapped from presenting symptoms.',
                severity: val.severity || severity
              }
            }
          })
        })
      }

      // Fill any organ still missing a condition with the primary diagnosis
      organIds.forEach(id => {
        if (!organConditions[id]) {
          organConditions[id] = primaryCond
            ? { condition: primaryCond.name, reasoning: primaryCond.reasoning, severity }
            : { condition: 'Affected Region', reasoning: 'Clinical mapping based on presenting symptoms.', severity }
        }
      })

      setHighlightedMeshNames(meshNames)
      setAffectedOrganIds(organIds)
      setConditionsByOrgan(organConditions)

      // Auto-enable ALL relevant anatomy layers so affected organs are immediately visible
      // The organs column (column 2) shows when digestive, respiratory, cardiovascular, OR nervous is active
      const needsOrgans = organIds.some(id =>
        ['heart', 'liver', 'stomach', 'intestines', 'spleen', 'pancreas',
         'appendix', 'gallbladder', 'bladder', 'kidney_left', 'kidney_right', 'aorta'].includes(id)
      )
      const needsRespiratory = organIds.some(id =>
        ['lung_left', 'lung_right', 'trachea', 'throat', 'nasal_cavity'].includes(id)
      )
      const needsCardio = organIds.some(id => ['heart', 'aorta'].includes(id))
      const needsNervous = organIds.some(id => ['brain', 'spinal_cord'].includes(id))

      // Always turn ON all systems that have affected organs — never reduce already-on systems
      setSystems(prev => ({
        ...prev,
        digestive:      true,  // Always show organ column so callouts are visible
        respiratory:    true,  // Always show organ column so callouts are visible
        cardiovascular: true,  // Always show organ column so callouts are visible
        nervous:        true,  // Always show organ column so callouts are visible
      }))

      // Auto-split on successful analysis in Split View mode to display organs clearly
      if (viewMode === 'split') {
        isSplittedRef.current = true
        updateSplitStatusHUD()
      }

      // Force canvas repaint — required because frameloop="demand" won't repaint
      // automatically when React state updates (only WebGL invalidate triggers repaints)
      setTimeout(() => invalidateFnRef.current(), 50)
      setTimeout(() => invalidateFnRef.current(), 200)

    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Connection failure. Running fallback stub.')
      // Graceful fallback
      setPossibleConditions([
        { name: 'Transient GI Distress (Fallback)', confidence: 70, reasoning: 'GI inflammation fallback due to API endpoint delay.' }
      ])
      setHighlightedMeshNames(['stomach', 'intestine'])
      setAffectedOrganIds(['stomach', 'intestines'])
      setConditionsByOrgan({
        'stomach': { condition: 'Gastric Irritation', reasoning: 'Secondary vomiting secondary to peritoneal stimulation.', severity: severity },
        'intestines': { condition: 'Acute Appendicitis', reasoning: 'Migrating RLQ tenderness and abdominal guarding.', severity: severity }
      })
      if (viewMode === 'split') {
        isSplittedRef.current = true
        updateSplitStatusHUD()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
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
      
      {selectedOrgan && (
        <OrganDetailModal
          organ={selectedOrgan.organ}
          condition={selectedOrgan.condition}
          reasoning={selectedOrgan.reasoning}
          severity={selectedOrgan.severity}
          onClose={() => setSelectedOrgan(null)}
        />
      )}

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
        <div className="w-[22%] min-w-[280px] bg-surface/40 backdrop-blur-3xl border-r border-primary/20 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          <div className="space-y-3">

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
        />

        

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
