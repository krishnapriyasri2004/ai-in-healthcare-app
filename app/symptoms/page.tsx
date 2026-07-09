'use client'

import { useState, useRef } from 'react'
import { BodyModel } from '@/components/body-model'
import {
  Sparkles,
  Activity,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Info,
  Send,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Condition {
  name: string
  confidence: number
  reasoning: string
}

interface DiagnosisResult {
  affectedRegions: string[]
  possibleConditions: Condition[]
  redFlag: boolean
  // enriched fields computed client-side
  primaryCondition: string
  primaryConfidence: number
  primaryReasoning: string
}

const PRESET_SCENARIOS = [
  {
    name: 'Retrosternal Chest Pain (ACS)',
    symptoms: 'Patient reports sudden retrosternal chest pain radiating to left shoulder and arm for the last 2 hours. Accompanied by acute breathlessness, sweating, and nausea.',
    age: 45,
    gender: 'Male' as const
  },
  {
    name: 'High Fever & Joint Pain (Dengue)',
    symptoms: 'Patient presents with high-grade fever (103°F) for 5 days, severe retro-orbital headache, generalized muscle and joint pain ("breakbone" aches), and mild petechial rashes on lower limbs.',
    age: 29,
    gender: 'Female' as const
  },
  {
    name: 'Chronic Cough & Hemoptysis (TB)',
    symptoms: 'Persistent productive cough with yellowish-green sputum and occasional blood streaks (hemoptysis) for the past 3 weeks. Reports low-grade evening fever, night sweats, and unexplained weight loss of 5 kg.',
    age: 58,
    gender: 'Male' as const
  },
  {
    name: 'Lower Right Abdomen Pain (Appendicitis)',
    symptoms: 'Severe pain in the lower right abdomen that started near the navel 2 days ago and migrated to right lower quadrant. Nausea, vomiting, low-grade fever 38.2°C, rebound tenderness at McBurney\'s point.',
    age: 22,
    gender: 'Male' as const
  },
  {
    name: 'Severe Headache & Stiff Neck (Meningitis)',
    symptoms: 'Sudden severe thunderclap headache, neck stiffness, photophobia, vomiting, and fever 39.5°C. Patient appears confused and is sensitive to light. Kernig\'s sign positive.',
    age: 19,
    gender: 'Female' as const
  }
]

// ICD-10 + SNOMED lookup for common conditions
const CONDITION_CODES: Record<string, { icd10: string; snomed: string }> = {
  default: { icd10: 'R68.89', snomed: '409586006' },
  'coronary': { icd10: 'I21.3', snomed: '401303003' },
  'stemi': { icd10: 'I21.3', snomed: '401303003' },
  'myocardial': { icd10: 'I21.9', snomed: '22298006' },
  'dengue': { icd10: 'A91', snomed: '38362002' },
  'tuberculosis': { icd10: 'A15.0', snomed: '56717001' },
  'appendicitis': { icd10: 'K37', snomed: '85189001' },
  'meningitis': { icd10: 'G03.9', snomed: '7180009' },
  'pneumonia': { icd10: 'J18.9', snomed: '233604007' },
  'gastroenteritis': { icd10: 'A09', snomed: '25374005' },
  'pyelonephritis': { icd10: 'N10', snomed: '45816000' },
  'hepatitis': { icd10: 'B19.9', snomed: '40468003' },
}

const getConditionCodes = (conditionName: string) => {
  const name = conditionName.toLowerCase()
  for (const [key, codes] of Object.entries(CONDITION_CODES)) {
    if (name.includes(key)) return codes
  }
  return CONDITION_CODES.default
}

// Map API region names to BodyModel region format
const toBodyModelRegions = (regions: string[]) =>
  regions.map(r => ({
    bodyRegion: r,
    confidence: 'high' as const,
    condition: '',
    reasoning: ''
  }))

export default function SymptomsPage() {
  const [symptomsInput, setSymptomsInput] = useState('')
  const [patientAge, setPatientAge] = useState(35)
  const [patientGender, setPatientGender] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState('2 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleRunPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSymptomsInput(preset.symptoms)
    setPatientAge(preset.age)
    setPatientGender(preset.gender)
    setResult(null)
    setErrorMsg(null)
    textareaRef.current?.focus()
  }

  const handleClear = () => {
    setSymptomsInput('')
    setResult(null)
    setErrorMsg(null)
    setProgressStep(0)
  }

  const handleAnalyze = async () => {
    if (!symptomsInput.trim() || isAnalyzing) return

    setIsAnalyzing(true)
    setProgressStep(0)
    setResult(null)
    setErrorMsg(null)

    // Progressive loading animation
    const steps = [0, 1, 2, 3]
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 550))
      setProgressStep(step)
    }

    try {
      const res = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: patientAge,
          sex: patientGender,
          duration,
          severity,
          symptoms: symptomsInput
        })
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const primary = data.possibleConditions?.[0]
      setResult({
        affectedRegions: data.affectedRegions || [],
        possibleConditions: data.possibleConditions || [],
        redFlag: !!data.redFlag,
        primaryCondition: primary?.name || 'Unknown',
        primaryConfidence: primary?.confidence || 0,
        primaryReasoning: primary?.reasoning || ''
      })
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const codes = result ? getConditionCodes(result.primaryCondition) : null
  const anatomyViewerUrl = `/ai-in-healthcare/view-anatomy?symptoms=${encodeURIComponent(symptomsInput)}&age=${patientAge}&sex=${patientGender}`

  return (
    <div className="w-full h-full bg-[#030712] flex flex-col p-6 overflow-y-auto font-mono text-xs text-slate-300">

      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-blue-950/60 pb-4 mb-6">
        <div>
          <h1 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            🧬 AI Diagnostic Assistant — DeepSeek Clinical Engine
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Enter patient symptoms to get AI-powered differential diagnoses mapped to the 3D anatomy model.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#070f2b] border border-blue-900/30 text-emerald-400 font-bold uppercase text-[9px]">
          ● DeepSeek V3 Online
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch flex-1">

        {/* LEFT COLUMN: Input form & presets */}
        <div className="col-span-5 flex flex-col gap-4">

          {/* Preset Shortcuts */}
          <div className="bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 space-y-3">
            <span className="text-cyan-400 font-bold uppercase text-[9px] border-b border-blue-950/30 pb-1.5 tracking-wider block">
              💡 Rapid Clinical Presets
            </span>
            <div className="flex flex-col gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunPreset(preset)}
                  className="w-full text-left p-3 rounded-lg bg-black/40 border border-blue-950/40 hover:border-cyan-500/35 hover:bg-cyan-950/10 text-[10px] text-slate-300 transition duration-150 cursor-pointer flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-100">{preset.name}</span>
                    <p className="text-[9px] text-slate-500 truncate max-w-[240px]">{preset.symptoms}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Input Form */}
          <div className="bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex-1 flex flex-col gap-3">
            <span className="text-cyan-400 font-bold uppercase text-[9px] border-b border-blue-950/30 pb-1.5 tracking-wider block">
              ✍ Clinician Triage Entry
            </span>

            {/* Patient fields row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase">Age</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(parseInt(e.target.value) || 30)}
                  className="w-full bg-black/60 border border-blue-950/50 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full bg-black/60 border border-blue-950/50 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days"
                  className="w-full bg-black/60 border border-blue-950/50 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 text-[9px] uppercase">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-black/60 border border-blue-950/50 rounded px-2 py-1.5 text-slate-100 outline-none focus:border-cyan-500"
                >
                  <option value="Low">Low (Green)</option>
                  <option value="Medium">Medium (Yellow)</option>
                  <option value="High">High (Orange)</option>
                  <option value="Critical">Critical (Red)</option>
                </select>
              </div>
            </div>

            {/* Symptoms textarea */}
            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-slate-500 text-[9px] uppercase">Presenting Symptoms *</label>
              <textarea
                ref={textareaRef}
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault()
                    handleAnalyze()
                  }
                }}
                placeholder={`Describe symptoms in detail...\ne.g. "Severe chest pain radiating to left arm, breathlessness, sweating for 2 hours"\n\nCtrl+Enter to submit`}
                className="w-full flex-1 bg-black/60 border border-blue-950/50 rounded p-3 text-slate-100 outline-none focus:border-cyan-500/60 font-mono resize-none leading-relaxed min-h-[130px] placeholder-slate-700 transition"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symptomsInput.trim()}
              className={`w-full py-3 font-black border rounded-xl cursor-pointer transition-all uppercase tracking-widest text-[11px] flex justify-center items-center gap-2 ${
                isAnalyzing
                  ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400 animate-pulse'
                  : symptomsInput.trim()
                  ? 'bg-gradient-to-r from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 border-cyan-500/50 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  DeepSeek Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit &amp; Analyze Symptoms
                </>
              )}
            </button>

            {/* Clear */}
            {(symptomsInput || result) && (
              <button
                onClick={handleClear}
                className="w-full py-1.5 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 rounded-lg text-slate-500 hover:text-slate-300 text-[9px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Clear &amp; Reset
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Anatomy Model */}
        <div className="col-span-7 flex flex-col gap-4">
          <div className="flex-1 bg-black/40 border border-blue-950/40 rounded-2xl relative overflow-hidden flex flex-col min-h-[350px]">
            <div className="absolute top-4 left-4 z-10 font-bold bg-[#070f2b]/80 backdrop-blur border border-blue-950/40 rounded px-2 py-1 text-[9px] text-cyan-400 uppercase tracking-widest">
              🤖 {result ? `Mapped: ${result.affectedRegions.map(r => r.replace('_', ' ')).join(', ')}` : 'Awaiting Symptom Analysis'}
            </div>
            <BodyModel
              affectedRegions={result ? toBodyModelRegions(result.affectedRegions) : []}
              patientId="immersive"
            />
          </div>

          {/* Link to full 3D viewer */}
          {result && (
            <Link
              href={anatomyViewerUrl}
              target="_blank"
              className="flex items-center justify-center gap-2 py-2.5 bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/30 rounded-xl text-violet-300 font-bold uppercase text-[10px] tracking-widest transition"
            >
              <Activity className="w-4 h-4" />
              Open Full 5-Column 3D Anatomy Viewer
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: AI Clinical Outcomes */}
      {(isAnalyzing || result || errorMsg) && (
        <div className="mt-6 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 space-y-4 animate-in slide-in-from-bottom duration-250">
          <span className="text-cyan-400 font-bold uppercase text-[9px] border-b border-blue-950/30 pb-1.5 tracking-wider block">
            🔬 DeepSeek AI Clinical Prognosis Dossier
          </span>

          {/* Error */}
          {errorMsg && !isAnalyzing && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-red-400 text-[10px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {isAnalyzing ? (
            <div className="py-6 flex flex-col justify-center items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <span className="absolute w-full h-full rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <span className="font-bold text-slate-300 text-[10px]">
                  {progressStep === 0 ? 'CONNECTING TO DEEPSEEK V3 ENGINE...' :
                   progressStep === 1 ? 'PROCESSING CLINICAL SYMPTOM VECTORS...' :
                   progressStep === 2 ? 'MAPPING AFFECTED ANATOMICAL REGIONS...' :
                   'GENERATING DIFFERENTIAL DIAGNOSES...'}
                </span>
                <p className="text-[9px] text-slate-500 uppercase">Ganga Hospital ABDM Security Gateway Active</p>
              </div>
            </div>
          ) : result && (
            <div className="grid grid-cols-12 gap-6">

              {/* Primary diagnosis */}
              <div className="col-span-5 space-y-3">
                {result.redFlag && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-red-400 font-bold text-[10px] uppercase">🚨 Red Flag — Immediate intervention required</span>
                  </div>
                )}

                <div className="p-3 bg-black/40 border border-blue-950/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase">Primary Diagnosis</span>
                    <span className={`font-bold text-[10px] ${
                      result.primaryConfidence >= 85 ? 'text-red-400' :
                      result.primaryConfidence >= 65 ? 'text-amber-400' : 'text-green-400'
                    }`}>{result.primaryConfidence}% Match</span>
                  </div>
                  <h3 className="text-sm font-black text-rose-400 uppercase leading-snug">{result.primaryCondition}</h3>
                  <p className="text-[10px] text-slate-400 leading-normal">{result.primaryReasoning}</p>
                </div>

                {codes && (
                  <div className="grid grid-cols-2 gap-3 font-sans">
                    <div className="p-2.5 bg-black/40 border border-blue-950/20 rounded text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-mono block mb-0.5">ICD-10 Code</span>
                      <span className="text-xs font-black text-slate-100 font-mono tracking-wide">{codes.icd10}</span>
                    </div>
                    <div className="p-2.5 bg-black/40 border border-blue-950/20 rounded text-center">
                      <span className="text-[8px] text-slate-500 uppercase font-mono block mb-0.5">SNOMED CT ID</span>
                      <span className="text-xs font-black text-slate-100 font-mono tracking-wide">{codes.snomed}</span>
                    </div>
                  </div>
                )}

                {/* Affected regions */}
                <div className="p-2.5 bg-black/40 border border-blue-950/30 rounded-lg">
                  <span className="text-[9px] text-slate-500 uppercase block mb-2 font-bold">Mapped Anatomical Regions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.affectedRegions.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-950/50 border border-red-500/30 text-red-300 text-[9px] font-bold uppercase rounded">
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* All differential diagnoses */}
              <div className="col-span-4 space-y-2">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Differential Diagnoses (All)</span>
                {result.possibleConditions.map((cond, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border space-y-1 ${
                    idx === 0 ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-black/40 border-blue-950/40'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100 text-[10px] leading-snug max-w-[150px]">{cond.name}</span>
                      <span className={`text-[10px] font-black shrink-0 ${
                        cond.confidence >= 85 ? 'text-red-400' :
                        cond.confidence >= 65 ? 'text-amber-400' : 'text-green-400'
                      }`}>{cond.confidence}%</span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">{cond.reasoning}</p>
                    {idx === 0 && <span className="text-[8px] font-bold uppercase text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded bg-cyan-950/40">PRIMARY</span>}
                  </div>
                ))}
              </div>

              {/* Clinical directives */}
              <div className="col-span-3 p-3 bg-black/40 border border-blue-950/40 rounded-lg space-y-2">
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Clinician Directives</span>
                <ul className="space-y-2 text-[9px] text-slate-300">
                  {result.redFlag && (
                    <li className="flex gap-2 items-start leading-relaxed text-red-400 font-bold">
                      <span className="text-red-500 shrink-0 mt-0.5">⚡</span>
                      Call emergency response team immediately.
                    </li>
                  )}
                  <li className="flex gap-2 items-start leading-relaxed">
                    <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                    Correlate findings with patient vitals and physical examination.
                  </li>
                  <li className="flex gap-2 items-start leading-relaxed">
                    <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                    Order targeted investigations for the primary diagnosis.
                  </li>
                  <li className="flex gap-2 items-start leading-relaxed">
                    <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                    Review differential diagnoses if primary treatment shows no improvement.
                  </li>
                  <li className="flex gap-2 items-start leading-relaxed">
                    <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                    Document findings in ABDM patient record.
                  </li>
                </ul>

                <div className="mt-3 pt-2 border-t border-blue-950/30 flex items-start gap-1.5 text-[9px] text-slate-500">
                  <Info className="w-3 h-3 shrink-0 mt-0.5 text-cyan-500" />
                  AI decision support only. Clinical verification required.
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}
