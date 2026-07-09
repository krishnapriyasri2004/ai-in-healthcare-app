'use client'

import React, { useState, useEffect } from 'react'
import { BodyModel } from '@/components/body-model'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  AlertCircle
} from 'lucide-react'

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
interface RegionInfo {
  bodyRegion: string
  confidence: 'high' | 'medium' | 'low'
  condition: string
  reasoning: string
}

interface SystemToggles {
  skeletal: boolean
  muscular: boolean
  nervous: boolean
  cardiovascular: boolean
  respiratory: boolean
  digestive: boolean
  lymphatic: boolean
  integumentary: boolean
}

// ---------------------------------------------------------
// View Anatomy Page
// ---------------------------------------------------------
export default function ViewAnatomyPage() {
  // Patient symptom input fields
  const [age, setAge] = useState<number>(38)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState<string>('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState<string>('severe pain lower right abdomen, fever, nausea')

  // Analysis result state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [affectedRegions, setAffectedRegions] = useState<RegionInfo[]>([])
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [redFlag, setRedFlag] = useState<boolean>(false)
  const [symptomHighlightedRegions, setSymptomHighlightedRegions] = useState<string[]>([])

  // 3D layer toggles — reuse the same state shape as dashboard
  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true,
    muscular: true,
    nervous: false,
    cardiovascular: true,
    respiratory: true,
    digestive: true,
    lymphatic: false,
    integumentary: true
  })

  // Run initial stub on mount to demonstrate UI
  useEffect(() => {
    setAffectedRegions([
      {
        bodyRegion: 'intestines',
        confidence: 'high',
        condition: 'Acute Appendicitis',
        reasoning: 'Localized tenderness in the right lower quadrant, nausea, and low-grade pyrexia.'
      }
    ])
    setPossibleConditions([
      {
        name: 'Acute Appendicitis',
        confidence: 92,
        reasoning: 'Localized RLQ tenderness, pain migration from periumbilical area, nausea, and low-grade pyrexia match clinical appendicitis.'
      }
    ])
    setRedFlag(true)
    setSymptomHighlightedRegions(['intestine', 'stomach'])
  }, [])

  // Handle Analyze button
  const handleAnalyze = async () => {
    if (!symptomsInput.trim()) return
    setIsLoading(true)
    setErrorMsg(null)
    setAffectedRegions([])
    setPossibleConditions([])
    setRedFlag(false)
    setSymptomHighlightedRegions([])

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, sex, duration, severity, symptoms: symptomsInput })
      })

      if (!response.ok) throw new Error('API server responded with an error.')

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      // Map affectedRegions strings to RegionInfo objects for BodyModel markers
      const regions: RegionInfo[] = (data.affectedRegions || []).map((r: string) => ({
        bodyRegion: r,
        confidence: 'high' as const,
        condition: (data.possibleConditions?.[0]?.name) || 'Identified Region',
        reasoning: (data.possibleConditions?.[0]?.reasoning) || 'Region flagged by symptom analysis.'
      }))

      setAffectedRegions(regions)
      setPossibleConditions(data.possibleConditions || [])
      setRedFlag(!!data.redFlag)

      // Build mesh-name highlight list for emissive glow
      const highlights: string[] = []
      ;(data.affectedRegions || []).forEach((r: string) => {
        const key = r.toLowerCase()
        if (key === 'heart') highlights.push('heart', 'atrium', 'ventricle')
        else if (key === 'lungs') highlights.push('lung')
        else if (key === 'brain') highlights.push('brain', 'cerebr')
        else if (key === 'liver') highlights.push('liver')
        else if (key === 'stomach') highlights.push('stomach')
        else if (key === 'intestines') highlights.push('intestine')
        else if (key === 'kidneys') highlights.push('kidney')
        else if (key === 'trachea') highlights.push('trachea')
        else if (key === 'throat') highlights.push('throat')
        else highlights.push(key)
      })
      setSymptomHighlightedRegions(highlights)

    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Connection failure. Showing fallback stub results.')
      // Graceful fallback
      setAffectedRegions([
        { bodyRegion: 'stomach', confidence: 'medium', condition: 'Gastrointestinal Distress', reasoning: 'Fallback stub triggered due to API unavailability.' }
      ])
      setPossibleConditions([
        { name: 'Transient GI Distress (Fallback)', confidence: 70, reasoning: 'Generic fallback analysis due to downstream endpoint delay.' }
      ])
      setRedFlag(false)
      setSymptomHighlightedRegions(['stomach', 'intestine'])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full h-screen bg-[#020617] text-gray-100 flex flex-col font-mono text-xs select-none overflow-hidden relative">
      
      {/* TOP HEADER */}
      <div className="bg-[#070f2b]/85 border-b border-blue-950/60 px-4 py-3 z-10 flex justify-between items-center backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/scan" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-blue-950/50 hover:bg-slate-800 transition text-[10px] font-bold text-gray-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-blue-950/40"></div>
          <div>
            <h1 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> 
              Clinical 3D Anatomy Viewer & Symptom Mapper
            </h1>
            <p className="text-[9px] text-slate-500 mt-0.5">Enter symptoms to highlight affected anatomy regions on the 3D models in real-time.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 font-bold uppercase">● ABDM SECURE</span>
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/25 text-blue-400 font-bold uppercase">DEEPSEEK R1</span>
        </div>
      </div>

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">

        {/* LEFT PANEL: Patient Symptom Input (22%) */}
        <div className="w-[22%] bg-[#070f2b]/40 border-r border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          <div className="space-y-4">
            <span className="font-bold text-[11px] uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              📋 Patient Symptom Input
            </span>

            <div className="space-y-3 text-[10px]">
              {/* Age & Sex */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[9px]">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-black/60 border border-blue-950/60 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[9px]">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-black/60 border border-blue-950/60 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Symptom Duration */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px]">Symptom Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, 2 weeks"
                  className="w-full bg-black/60 border border-blue-950/60 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                />
              </div>

              {/* Severity Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px]">Clinical Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-black/60 border border-blue-950/60 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                >
                  <option value="Low">Low (Triage Green)</option>
                  <option value="Medium">Medium (Triage Yellow)</option>
                  <option value="High">High (Triage Orange)</option>
                  <option value="Critical">Critical (Triage Red)</option>
                </select>
              </div>

              {/* Free-text Symptoms Area */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px]">Symptoms Description</label>
                <textarea
                  rows={5}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Describe patient symptoms here (e.g. crushing chest pain, nausea, fever...)"
                  className="w-full bg-black/60 border border-blue-950/60 rounded p-2.5 text-white outline-none focus:border-cyan-500/40 text-xs resize-none leading-relaxed custom-scrollbar"
                />
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !symptomsInput.trim()}
            className="w-full mt-4 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.1)] disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                ANALYZING...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze & Map Anatomy
              </>
            )}
          </button>

          {/* Disclaimer */}
          <div className="mt-3 p-2 bg-slate-950/60 border border-blue-950/40 rounded-lg leading-relaxed flex items-start gap-1.5 text-slate-400 font-sans text-[9px]">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span><strong>AI-generated decision support</strong> — not a diagnosis. Requires clinical verification.</span>
          </div>
        </div>

        {/* CENTER: 3D Viewport using the shared BodyModel component (53%) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Layer Controls Bar */}
          <div className="bg-[#070f2b]/60 border-b border-blue-950/40 px-4 py-2 flex flex-wrap gap-2 text-[9px] items-center z-10 shrink-0">
            <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Anatomy Layers:</span>
            {[
              { label: 'Skin', key: 'integumentary' },
              { label: 'Skeleton', key: 'skeletal' },
              { label: 'Muscles', key: 'muscular' },
              { label: 'Organs', key: 'digestive' },
              { label: 'Vessels', key: 'cardiovascular' },
              { label: 'Nerves', key: 'nervous' }
            ].map(sys => {
              const isActive = (systems as any)[sys.key]
              return (
                <button
                  key={sys.key}
                  onClick={() => toggleSystem(sys.key as any)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer border ${
                    isActive ? 'bg-cyan-950/50 border-cyan-500/35 text-cyan-400 font-bold' : 'bg-black/35 border-blue-950/20 text-slate-500'
                  }`}
                >
                  {sys.label}
                </button>
              )
            })}
          </div>

          {/* 3D Canvas — reuse the exact same BodyModel that the dashboard uses */}
          <div className="flex-1 bg-black/40 border border-blue-950/40 rounded-b-2xl overflow-hidden relative">
            <BodyModel 
              affectedRegions={affectedRegions} 
              activeSystems={systems}
              symptomHighlightedRegions={symptomHighlightedRegions}
              patientId="viewer"
            />
          </div>
        </div>

        {/* RIGHT PANEL: Diagnosis Results (25%) */}
        <div className="w-[25%] bg-[#070f2b]/40 border-l border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          
          <div className="space-y-4">
            <span className="font-bold text-[11px] uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              🔬 AI Diagnostics Dossier
            </span>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 text-[10px] flex items-start gap-1.5 leading-snug animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Red Flag Emergency Banner */}
            {redFlag && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2 animate-pulse leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠️ Urgent findings — clinical correlation required.</span>
              </div>
            )}

            {/* Mapped Regions Summary */}
            {symptomHighlightedRegions.length > 0 && (
              <div className="p-2.5 bg-black/40 border border-blue-950/40 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5">Mapped Body Regions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {affectedRegions.map((r, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-300 text-[9px] font-bold uppercase">
                      {r.bodyRegion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Conditions Cards */}
            <div className="space-y-3">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Possible Conditions:</span>
              
              {possibleConditions.length > 0 ? (
                possibleConditions.map((cond, idx) => (
                  <div key={idx} className="p-3 bg-black/40 border border-blue-950/40 rounded-xl space-y-1.5 hover:border-cyan-500/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-rose-400 text-[11px] uppercase tracking-wide truncate max-w-[150px]">
                        {cond.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold shrink-0">
                        {cond.confidence}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      {cond.reasoning}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-center text-[10px]">
                  Submit symptom entry to construct diagnosis maps.
                </div>
              )}
            </div>
          </div>

          {/* Bottom spacer disclaimer */}
          <div className="mt-6 p-2 bg-slate-950/60 border border-blue-950/40 rounded-lg leading-relaxed flex items-start gap-1.5 text-slate-400 font-sans text-[9px]">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span>AI-generated. Not a clinical diagnosis. Requires professional medical validation.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
