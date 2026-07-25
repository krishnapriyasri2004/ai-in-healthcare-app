'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Heart, Calendar, Search, ClipboardList, ShieldAlert, Award, Sparkles, AlertTriangle, CheckCircle2, Loader2, ExternalLink, Brain, Activity, Download } from 'lucide-react'
import { useAppContext, Patient, DiagnosisResult } from '@/components/AppContext'

export default function PatientsPage() {
  const { patients, setPatients, selectedPatientId, setSelectedPatientId, activePatient, setActiveDiagnosisResult } = useAppContext()
  const [searchQuery, setSearchQuery] = useState('')

  // Symptom input & AI analysis state
  const [symptomInput, setSymptomInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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

  const [showAddModal, setShowAddModal] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientAge, setNewPatientAge] = useState('35')
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female'>('Male')
  const [newPatientAbha, setNewPatientAbha] = useState('')
  const [newPatientPmjay, setNewPatientPmjay] = useState<'Eligible' | 'Not Enrolled' | 'Under Verification'>('Not Enrolled')
  const [newPatientHr, setNewPatientHr] = useState('72')
  const [newPatientTemp, setNewPatientTemp] = useState('36.6')
  const [newPatientSpo2, setNewPatientSpo2] = useState('98')
  const [newPatientBp, setNewPatientBp] = useState('120/80')
  const [newPatientSugar, setNewPatientSugar] = useState('')
  const [newPatientSymptoms, setNewPatientSymptoms] = useState('')
  const [newPatientNotes, setNewPatientNotes] = useState('')

  const handleAddPatient = () => {
    setShowAddModal(true)
  }

  const handleSubmitNewPatient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatientName.trim()) return

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: newPatientName.trim(),
      age: parseInt(newPatientAge) || 35,
      gender: newPatientGender,
      abhaId: newPatientAbha.trim() || undefined,
      pmjayEligible: newPatientPmjay,
      symptoms: newPatientSymptoms.trim() || 'No active symptoms described.',
      notes: newPatientNotes.trim() || 'New clinical registry created.',
      vitals: {
        temp: newPatientTemp.trim() || '36.6',
        hr: newPatientHr.trim() || '72',
        spo2: newPatientSpo2.trim() || '98',
        bp: newPatientBp.trim() || '120/80',
      },
      bloodSugar: newPatientSugar.trim() || undefined,
      history: []
    }

    setPatients(prev => [...prev, newPatient])
    setSelectedPatientId(newPatient.id)
    setDiagnosisResult(null)
    setErrorMsg(null)
    setSymptomInput('')
    
    // Reset form states
    setNewPatientName('')
    setNewPatientAge('35')
    setNewPatientGender('Male')
    setNewPatientAbha('')
    setNewPatientPmjay('Not Enrolled')
    setNewPatientHr('72')
    setNewPatientTemp('36.6')
    setNewPatientSpo2('98')
    setNewPatientBp('120/80')
    setNewPatientSugar('')
    setNewPatientSymptoms('')
    setNewPatientNotes('')
    setShowAddModal(false)
  }

  // Submit symptoms to Gemini via the API route
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
      
      const primary = data.possibleConditions?.[0]
      const finalResult: DiagnosisResult = {
        affectedRegions: data.affectedRegions || [],
        possibleConditions: data.possibleConditions || [],
        redFlag: !!data.redFlag,
        primaryCondition: primary?.name || '',
        primaryConfidence: primary?.confidence || 0,
        primaryReasoning: primary?.reasoning || ''
      }
      
      setDiagnosisResult(finalResult)
      setActiveDiagnosisResult(finalResult) // Sync to global context
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Automatically trigger AI analysis when active patient changes and has active symptoms
  useEffect(() => {
    if (!activePatient) return

    const symptoms = activePatient.symptoms
    if (symptoms && symptoms !== 'No active symptoms described.' && symptoms.trim() !== '') {
      const autoAnalyze = async () => {
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
          
          const primary = data.possibleConditions?.[0]
          const finalResult: DiagnosisResult = {
            affectedRegions: data.affectedRegions || [],
            possibleConditions: data.possibleConditions || [],
            redFlag: !!data.redFlag,
            primaryCondition: primary?.name || '',
            primaryConfidence: primary?.confidence || 0,
            primaryReasoning: primary?.reasoning || ''
          }
          
          setDiagnosisResult(finalResult)
          setActiveDiagnosisResult(finalResult)
        } catch (err: any) {
          setErrorMsg(err.message || 'Analysis failed. Please try again.')
        } finally {
          setIsAnalyzing(false)
        }
      }
      autoAnalyze()
    } else {
      setDiagnosisResult(null);
    }
  }, [selectedPatientId, activePatient?.symptoms])

  // Clear analysis result if no symptom description exists anywhere (textarea is empty and patient has no symptoms)
  useEffect(() => {
    const inputVal = symptomInput.trim()
    const activeVal = activePatient?.symptoms || ''
    const hasSymptoms = (inputVal !== '') || (activeVal !== '' && activeVal !== 'No active symptoms described.')
    if (!hasSymptoms) {
      setDiagnosisResult(null)
    }
  }, [symptomInput, activePatient?.symptoms])

  // Build anatomy viewer URL with pre-filled symptoms for 3D mapping
  const getAnatomyViewerUrl = () => {
    const symptoms = symptomInput.trim() || activePatient.symptoms
    return `/ai-in-healthcare/view-anatomy?symptoms=${encodeURIComponent(symptoms)}&age=${activePatient.age}&sex=${activePatient.gender}`
  }

  return (
    <div className="w-full h-full p-8 flex gap-6 overflow-y-auto custom-scrollbar bg-surface font-sans">
      {/* Left panel: Directory registry */}
      <div className="w-96 flex flex-col gap-4 glass-panel backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="font-bold text-sm tracking-wider uppercase text-cyan-400 flex items-center gap-2 font-mono">
            <Users className="w-4.5 h-4.5" /> Patient Directory
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Symptoms', 'Clinical Notes', 'Heart Rate (BPM)', 'SpO2 (%)', 'Temperature (°C)', 'Blood Pressure', 'ABHA ID', 'PM-JAY Eligibility', 'Blood Sugar (mg/dL)'];
                const rows = patients.map(p => [
                  p.id,
                  p.name,
                  p.age,
                  p.gender,
                  `"${p.symptoms.replace(/"/g, '""')}"`,
                  `"${p.notes.replace(/"/g, '""')}"`,
                  p.vitals.hr,
                  p.vitals.spo2,
                  p.vitals.temp,
                  p.vitals.bp,
                  p.abhaId || 'N/A',
                  p.pmjayEligible || 'N/A',
                  p.bloodSugar || 'N/A'
                ]);
                const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `patient_registry_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              title="Download Registry as Excel CSV"
              className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900/40 transition text-emerald-400"
            >
              <Download className="w-3.5 h-3.5" /> EXCEL
            </button>
            <button
              onClick={handleAddPatient}
              className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2 py-1 rounded bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/40 transition text-cyan-400"
            >
              <Plus className="w-3.5 h-3.5" /> ADD
            </button>
          </div>
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
                  Gemini AI — Clinical Symptom Analysis & 3D Body Mapping
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Powered by Gemini 2.5</span>
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
                    Analyzing with Gemini AI...
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


      {/* Add Patient Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200 p-4">
          <form 
            onSubmit={handleSubmitNewPatient}
            className="w-full max-w-2xl bg-[#030712]/95 border border-cyan-500/30 rounded-xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-sm tracking-wider uppercase text-cyan-400 flex items-center gap-2 font-mono">
                <Plus className="w-5 h-5" /> Add New Clinical Profile
              </span>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={newPatientAge}
                    onChange={e => setNewPatientAge(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Sex</label>
                  <select
                    value={newPatientGender}
                    onChange={e => setNewPatientGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">ABHA ID (Optional)</label>
                <input
                  type="text"
                  value={newPatientAbha}
                  onChange={e => setNewPatientAbha(e.target.value)}
                  placeholder="91-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">PM-JAY Eligibility</label>
                <select
                  value={newPatientPmjay}
                  onChange={e => setNewPatientPmjay(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                >
                  <option value="Not Enrolled">Not Enrolled</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Under Verification">Under Verification</option>
                </select>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="border-t border-white/10 pt-3">
              <span className="font-bold text-[10px] tracking-wider uppercase text-cyan-500 font-mono">Patient Vitals & Telemetry</span>
              <div className="grid grid-cols-5 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">HR (BPM)</label>
                  <input
                    type="text"
                    value={newPatientHr}
                    onChange={e => setNewPatientHr(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">Temp (°C)</label>
                  <input
                    type="text"
                    value={newPatientTemp}
                    onChange={e => setNewPatientTemp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">SpO2 (%)</label>
                  <input
                    type="text"
                    value={newPatientSpo2}
                    onChange={e => setNewPatientSpo2(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">Blood Press.</label>
                  <input
                    type="text"
                    value={newPatientBp}
                    onChange={e => setNewPatientBp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-mono text-gray-500 uppercase">Sugar (mg/dL)</label>
                  <input
                    type="text"
                    value={newPatientSugar}
                    onChange={e => setNewPatientSugar(e.target.value)}
                    placeholder="e.g. 110"
                    className="w-full px-2 py-1.5 bg-black border border-white/10 rounded text-xs outline-none focus:border-cyan-500/40 text-gray-300 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms & Notes Textareas */}
            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Symptoms Description</label>
                <textarea
                  value={newPatientSymptoms}
                  onChange={e => setNewPatientSymptoms(e.target.value)}
                  placeholder="Describe patient symptoms in detail..."
                  rows={2}
                  className="w-full p-2 bg-black border border-white/10 rounded-lg text-xs text-gray-300 font-mono outline-none focus:border-cyan-500/40 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Clinical Case Notes</label>
                <textarea
                  value={newPatientNotes}
                  onChange={e => setNewPatientNotes(e.target.value)}
                  placeholder="Enter medical history, clinical remarks, or case notes..."
                  rows={2}
                  className="w-full p-2 bg-black border border-white/10 rounded-lg text-xs text-gray-300 font-mono outline-none focus:border-cyan-500/40 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t border-white/10 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold text-gray-400 font-mono hover:bg-white/5 transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/60 hover:to-blue-800/60 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-300 font-mono transition"
              >
                SAVE PROFILE
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
