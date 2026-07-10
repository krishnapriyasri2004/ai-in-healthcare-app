'use client'

import { useState } from 'react'
import { Users, Plus, Heart, Calendar, Search, ClipboardList, ShieldAlert, Award, Sparkles, AlertTriangle, CheckCircle2, Loader2, ExternalLink, Brain, Activity } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  symptoms: string
  notes: string
  vitals: { temp: string; hr: string; spo2: string; bp: string }
  history: Array<{ date: string; diagnosis: string; severity: string }>
  abhaId?: string
  pmjayEligible?: 'Eligible' | 'Ineligible' | 'Under Verification'
  bloodSugar?: string
}

interface DiagnosisResult {
  affectedRegions: string[]
  possibleConditions: { name: string; confidence: number; reasoning: string }[]
  redFlag: boolean
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Rajesh Khanna',
    age: 45,
    gender: 'Male',
    symptoms: 'Patient reports sudden retrosternal chest pain radiating to left shoulder and arm for the last 2 hours. Accompanied by acute breathlessness, sweating, and nausea.',
    notes: 'Known history of Type 2 Diabetes Mellitus (HbA1c: 7.8%) and Hypertension. Heavy smoker.',
    vitals: { temp: '36.8', hr: '104', spo2: '94', bp: '150/95' },
    abhaId: '91-4829-4820-1948',
    pmjayEligible: 'Eligible',
    bloodSugar: '184',
    history: [
      { date: '2026-05-10', diagnosis: 'Essential Hypertension', severity: 'Medium' },
      { date: '2026-02-14', diagnosis: 'Type 2 Diabetes Mellitus', severity: 'Medium' }
    ]
  },
  {
    id: 'pat-2',
    name: 'Priya Sharma',
    age: 29,
    gender: 'Female',
    symptoms: 'Patient presents with high-grade fever (103°F) for 5 days, severe retro-orbital headache, generalized muscle and joint pain ("breakbone" aches), and mild petechial rashes on lower limbs.',
    notes: 'No major medical history. Living in a vector-heavy area during monsoon season.',
    vitals: { temp: '39.4', hr: '98', spo2: '97', bp: '105/70' },
    abhaId: '23-9081-3482-1249',
    pmjayEligible: 'Under Verification',
    bloodSugar: '95',
    history: [
      { date: '2026-06-01', diagnosis: 'Acute Pharyngitis', severity: 'Low' }
    ]
  },
  {
    id: 'pat-3',
    name: 'Amit Patel',
    age: 58,
    gender: 'Male',
    symptoms: 'Persistent productive cough with yellowish-green sputum and occasional blood streaks (hemoptysis) for the past 3 weeks. Reports low-grade evening fever, night sweats, and unexplained weight loss of 5 kg.',
    notes: 'Prior history of moderate chronic asthma. Worked in poorly ventilated textile mills.',
    vitals: { temp: '37.8', hr: '82', spo2: '96', bp: '118/75' },
    abhaId: '88-4328-9843-2390',
    pmjayEligible: 'Eligible',
    bloodSugar: '110',
    history: [
      { date: '2026-04-12', diagnosis: 'Asthma Exacerbation', severity: 'Medium' }
    ]
  }
]

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  const [searchQuery, setSearchQuery] = useState('')

  // Symptom input & AI analysis state
  const [symptomInput, setSymptomInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0]

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset analysis when switching patients
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id)
    setDiagnosisResult(null)
    setErrorMsg(null)
    setSymptomInput('')
  }

  const handleAddPatient = () => {
    const name = prompt("Enter patient full name:")
    if (!name) return
    const ageStr = prompt("Enter age:")
    const age = parseInt(ageStr || '35')
    const gender = confirm("Select biological sex: OK for Female, Cancel for Male") ? 'Female' : 'Male'

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name,
      age,
      gender,
      symptoms: 'No active symptoms described.',
      notes: 'New clinical registry created.',
      vitals: { temp: '36.6', hr: '72', spo2: '98', bp: '120/80' },
      history: []
    }

    setPatients(prev => [...prev, newPatient])
    setSelectedPatientId(newPatient.id)
    setDiagnosisResult(null)
    setErrorMsg(null)
    setSymptomInput('')
  }

  // Submit symptoms to DeepSeek via the API route
  const handleAnalyze = async () => {
    const symptoms = symptomInput.trim() || activePatient.symptoms
    if (!symptoms) return

    setIsAnalyzing(true)
    setDiagnosisResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: activePatient.age,
          sex: activePatient.gender,
          duration: 'As described',
          severity: 'Moderate',
          symptoms
        })
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDiagnosisResult(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Build anatomy viewer URL with pre-filled symptoms for 3D mapping
  const getAnatomyViewerUrl = () => {
    const symptoms = symptomInput.trim() || activePatient.symptoms
    return `/ai-in-healthcare/view-anatomy?symptoms=${encodeURIComponent(symptoms)}&age=${activePatient.age}&sex=${activePatient.gender}`
  }

  return (
    <div className="w-full h-full p-8 flex gap-6 overflow-hidden bg-surface font-sans">
      {/* Left panel: Directory registry */}
      <div className="w-96 flex flex-col gap-4 glass-panel backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="font-bold text-sm tracking-wider uppercase text-cyan-400 flex items-center gap-2 font-mono">
            <Users className="w-4.5 h-4.5" /> Patient Directory
          </span>
          <button
            onClick={handleAddPatient}
            className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/40 transition text-cyan-400"
          >
            <Plus className="w-3.5 h-3.5" /> ADD
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 transition text-gray-300 font-mono"
          />
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredPatients.map(p => (
            <div
              key={p.id}
              onClick={() => handleSelectPatient(p.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-300 flex justify-between items-start ${
                selectedPatientId === p.id
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'bg-black/30 border-white/10 hover:bg-white/5'
              }`}
            >
              <div>
                <h4 className="font-bold text-xs text-white">{p.name}</h4>
                <div className="text-[10px] text-gray-400 mt-1 uppercase font-mono">{p.gender}, Age {p.age}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 font-mono text-[9px]">
                <span className="text-gray-500 uppercase">SYS ID: {p.id.split('-')[1] || p.id}</span>
                <span className="text-cyan-400 font-bold">{p.vitals.hr} BPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: Detailed Patient EHR */}
      {activePatient && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

          {/* Header patient profile info */}
          <div className="glass-panel backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div>
              <div className="text-[10px] text-cyan-500 tracking-widest font-bold font-mono uppercase">ABHA VERIFIED CLINICAL PROFILE</div>
              <h2 className="text-2xl font-black text-white mt-1.5">{activePatient.name}</h2>
              <div className="text-xs text-gray-400 mt-1 font-mono uppercase">
                Gender: <span className="text-gray-200 font-bold mr-4">{activePatient.gender}</span>
                Age: <span className="text-gray-200 font-bold mr-4">{activePatient.age}</span>
                ABHA ID: <span className="text-cyan-400 font-bold mr-4">{activePatient.abhaId || 'N/A'}</span>
                PM-JAY: <span className={`font-bold mr-4 ${activePatient.pmjayEligible === 'Eligible' ? 'text-green-400' : activePatient.pmjayEligible === 'Under Verification' ? 'text-amber-400' : 'text-red-400'}`}>{activePatient.pmjayEligible || 'Not Enrolled'}</span>
                File ID: <span className="text-gray-300 font-bold">{activePatient.id}</span>
              </div>
            </div>
            <div className="flex gap-3 font-mono text-[10px]">
              <div className="glass-panel border border-white/10 p-2 px-3.5 rounded text-center">
                <div className="text-gray-500 uppercase text-[8px] mb-0.5">Vitals Status</div>
                <div className="text-green-500 font-bold uppercase">ABDM SYNCED</div>
              </div>
            </div>
          </div>

          {/* Vitals & Telemetry Grid */}
          <div className="grid grid-cols-5 gap-4">
            <div className="glass-panel border border-white/10 p-4 rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
              <div className="text-[10px] font-mono text-gray-500 uppercase flex justify-between items-center">
                HEART RATE
                <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.hr} <span className="text-xs text-gray-400 font-normal">BPM</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Resting Pulse</div>
            </div>

            <div className="glass-panel border border-white/10 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">BODY TEMP</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.temp} <span className="text-xs text-gray-400 font-normal">°C</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Core Oral</div>
            </div>

            <div className="glass-panel border border-white/10 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">OXYGEN SAT</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.spo2} <span className="text-xs text-gray-400 font-normal">%</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">SpO2 (Pulse Ox)</div>
            </div>

            <div className="glass-panel border border-white/10 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">BLOOD PRESS.</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.bp}</div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Systolic/Diastolic</div>
            </div>

            <div className="glass-panel border border-white/10 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">BLOOD SUGAR</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.bloodSugar || 'N/A'} <span className="text-xs text-gray-400 font-normal">mg/dL</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Random Assay</div>
            </div>
          </div>

          {/* ── AI SYMPTOM ANALYSIS PANEL ── */}
          <div className="glass-panel/60 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/20 bg-black/30">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs uppercase text-cyan-400 font-mono tracking-widest">
                  DeepSeek AI — Clinical Symptom Analysis & 3D Body Mapping
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Powered by DeepSeek R1</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Pre-filled existing symptoms display */}
              <div className="text-[10px] text-slate-400 font-mono">
                <span className="text-slate-500">Current registered symptoms:</span>
                <p className="mt-1 text-slate-300 leading-relaxed">{activePatient.symptoms}</p>
              </div>

              {/* Symptom textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Enter / Update Patient Symptoms for AI Analysis:
                </label>
                <textarea
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  placeholder={`Describe ${activePatient.name}'s current symptoms in detail (e.g. location, severity, duration, associated signs)...`}
                  rows={4}
                  className="w-full p-3 bg-black/50 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 font-mono leading-relaxed outline-none focus:border-cyan-500/40 transition resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-3 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/60 hover:to-blue-800/60 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-300 uppercase tracking-widest font-mono transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing with DeepSeek AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Submit Symptoms — Analyze & Map to 3D Body
                  </>
                )}
              </button>

              {/* Error */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-xs text-red-400 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* ── DIAGNOSIS RESULTS ── */}
              {diagnosisResult && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  {/* Red flag alert */}
                  {diagnosisResult.redFlag && (
                    <div className="flex items-center gap-3 p-3 bg-red-950/40 border border-red-500/50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-red-400 font-mono uppercase tracking-wide">🚨 Red Flag Emergency Detected</div>
                        <div className="text-[10px] text-red-300/80 font-mono mt-0.5">Immediate clinical intervention required. Escalate to senior clinician now.</div>
                      </div>
                    </div>
                  )}

                  {/* Affected organs */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Affected Anatomical Regions:</div>
                    <div className="flex flex-wrap gap-2">
                      {diagnosisResult.affectedRegions.map(region => (
                        <span
                          key={region}
                          className="px-3 py-1 bg-cyan-950/50 border border-cyan-500/40 rounded-full text-[10px] font-bold text-cyan-300 font-mono uppercase tracking-wide"
                        >
                          🫀 {region.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ranked conditions */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Differential Diagnoses (Ranked by Confidence):</div>
                    <div className="space-y-2">
                      {diagnosisResult.possibleConditions.map((cond, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border flex items-start gap-3 ${
                            i === 0
                              ? 'bg-cyan-950/30 border-cyan-500/40'
                              : 'glass-panel border-white/10'
                          }`}
                        >
                          <div className={`text-sm font-black font-mono shrink-0 mt-0.5 ${
                            cond.confidence >= 85 ? 'text-red-400' :
                            cond.confidence >= 65 ? 'text-amber-400' : 'text-green-400'
                          }`}>
                            {cond.confidence}%
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{cond.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 leading-relaxed">{cond.reasoning}</div>
                          </div>
                          {i === 0 && (
                            <span className="ml-auto shrink-0 text-[8px] font-bold uppercase font-mono px-1.5 py-0.5 bg-cyan-900/60 border border-cyan-500/30 rounded text-cyan-400">
                              PRIMARY
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View on 3D body button */}
                  <a
                    href={getAnatomyViewerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-violet-900/60 to-cyan-900/60 hover:from-violet-800/60 hover:to-cyan-800/60 border border-violet-500/40 rounded-lg text-xs font-bold text-violet-200 uppercase tracking-widest font-mono transition flex items-center justify-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    View Affected Regions on 3D Anatomy Model
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis & clinical notes */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-black/50 border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Scanner Transcripts
              </span>
              <div className="p-3 glass-panel rounded border border-white/10 font-mono text-xs text-gray-300 min-h-[90px] leading-relaxed">
                {activePatient.symptoms || "No clinical symptoms registered for active patient. Navigate to scanner screen to analyze symptoms."}
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 p-5 rounded-xl flex flex-col gap-3">
              <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Clinical Case Notes
              </span>
              <div className="p-3 glass-panel rounded border border-white/10 font-mono text-xs text-gray-300 min-h-[90px] leading-relaxed">
                {activePatient.notes || "No general history notes submitted."}
              </div>
            </div>
          </div>

          {/* Historical Scans timeline */}
          <div className="glass-panel border border-white/10 p-5 rounded-xl flex flex-col gap-4">
            <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5 border-b border-white/10 pb-2">
              <Calendar className="w-4 h-4" /> Diagnostic Scan Records Timeline
            </span>
            {activePatient.history.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {activePatient.history.map((record, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded bg-black/50 border border-white/10">
                    <div className="flex gap-4">
                      <span className="text-gray-500">{record.date}</span>
                      <span className="text-white font-bold">{record.diagnosis}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      record.severity === 'High' ? 'bg-red-950/50 text-red-400' : record.severity === 'Medium' ? 'bg-orange-950/50 text-orange-400' : 'bg-green-950/50 text-green-400'
                    }`}>
                      {record.severity} Severity
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 font-mono">
                No historical telemetry scans found on record for {activePatient.name}.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
