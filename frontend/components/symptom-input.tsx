'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  Activity, 
  Mic, 
  MicOff, 
  Heart, 
  Thermometer, 
  Wind, 
  AlertTriangle,
  User,
  Clock,
  Plus,
  X,
  FileText,
  SlidersHorizontal,
  FileUp,
  RotateCcw,
  CheckCircle,
  HelpCircle
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  symptoms: string
  notes: string
  vitals: { temp: string; hr: string; spo2: string; bp: string }
  analysis: any
  bloodType?: string
  esiLevel?: number
  painScale?: number
  selectedHistory?: string[]
  abhaId?: string
  pmjayEligible?: 'Eligible' | 'Ineligible' | 'Under Verification'
  bloodSugar?: string
}

interface SymptomInputProps {
  onAnalyze: (
    symptoms: string, 
    notes: string, 
    gender: string, 
    vitals: { temp: string; hr: string; spo2: string; bp: string },
    patientUpdates?: {
      age: number
      gender: 'Male' | 'Female'
      bloodType: string
      esiLevel: number
      painScale: number
      selectedHistory: string[]
      abhaId?: string
      pmjayEligible?: 'Eligible' | 'Ineligible' | 'Under Verification'
      bloodSugar?: string
    }
  ) => Promise<void>
  isLoading: boolean
  activePatient: Patient
}

const COMMON_COMPLAINTS = [
  { id: 'chest_pain', label: 'Chest Pain', system: 'cardiovascular' },
  { id: 'dyspnea', label: 'Shortness of Breath', system: 'respiratory' },
  { id: 'cephalalgia', label: 'Severe Headache / Retro-orbital', system: 'nervous' },
  { id: 'abdominal_pain', label: 'Abdominal Pain', system: 'digestive' },
  { id: 'hemoptysis', label: 'Cough with Blood (Hemoptysis)', system: 'respiratory' },
  { id: 'high_fever', label: 'High Grade Fever', system: 'immune' },
  { id: 'arthralgia', label: 'Joint / Muscle Aches', system: 'skeletal' },
  { id: 'dysuria', label: 'Painful Urination', system: 'urinary' }
]

const COMORBIDITIES = [
  'Hypertension',
  'Diabetes Type II',
  'Asthma / COPD',
  'Coronary Artery Disease',
  'Tuberculosis History',
  'Chronic Kidney Disease',
  'Hyperlipidemia'
]

const ESI_LEVELS = [
  { level: 1, label: 'Resuscitation', color: 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)] font-black' },
  { level: 2, label: 'Emergent', color: 'bg-orange-950/40 border-orange-500/50 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.2)] font-black' },
  { level: 3, label: 'Urgent', color: 'bg-amber-950/40 border-amber-500/50 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-black' },
  { level: 4, label: 'Less Urgent', color: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-black' },
  { level: 5, label: 'Non-Urgent', color: 'bg-sky-950/40 border-sky-500/50 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.2)] font-black' }
]

export function SymptomInput({ onAnalyze, isLoading, activePatient }: SymptomInputProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'ocr' | 'dictation'>('direct')

  // Form Field States
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [gender, setGender] = useState<'Male' | 'Female'>('Female')
  const [age, setAge] = useState('28')
  const [bloodType, setBloodType] = useState('O+')
  const [esiLevel, setEsiLevel] = useState<number>(3)
  const [painScale, setPainScale] = useState<number>(5)
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([])
  const [selectedHistory, setSelectedHistory] = useState<string[]>([])
  const [abhaId, setAbhaId] = useState('')
  const [pmjayEligible, setPmjayEligible] = useState<'Eligible' | 'Ineligible' | 'Under Verification'>('Eligible')
  
  // Vitals State
  const [temp, setTemp] = useState('37.0')
  const [hr, setHr] = useState('75')
  const [spo2, setSpo2] = useState('98')
  const [bpSys, setBpSys] = useState('120')
  const [bpDia, setBpDia] = useState('80')
  const [bloodSugar, setBloodSugar] = useState('100')

  // OCR & Dictation Processing State
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [dictationText, setDictationText] = useState('')
  const [unverifiedData, setUnverifiedData] = useState<any | null>(null)

  // Speech Dictation State
  const [isListening, setIsListening] = useState(false)

  // Sync state when activePatient changes in Dashboard (Real-time EHR sync)
  useEffect(() => {
    if (activePatient) {
      setAge(activePatient.age.toString())
      setGender(activePatient.gender)
      setBloodType(activePatient.bloodType || 'O+')
      setEsiLevel(activePatient.esiLevel || 3)
      setPainScale(activePatient.painScale || 5)
      setAbhaId(activePatient.abhaId || '')
      setPmjayEligible(activePatient.pmjayEligible || 'Eligible')
      
      // Sync symptoms text
      setSymptoms(activePatient.symptoms || '')
      setNotes(activePatient.notes || '')
      
      // Sync vitals
      setTemp(activePatient.vitals.temp)
      setHr(activePatient.vitals.hr)
      setSpo2(activePatient.vitals.spo2)
      if (activePatient.vitals.bp) {
        const [sys, dia] = activePatient.vitals.bp.split('/')
        setBpSys(sys || '120')
        setBpDia(dia || '80')
      }
      setBloodSugar(activePatient.bloodSugar || '100')

      // Sync History
      setSelectedHistory(activePatient.selectedHistory || [])
      setUnverifiedData(null)
    }
  }, [activePatient])

  // Debounced auto-analyzer for Direct Intake Form
  useEffect(() => {
    // Only auto-analyze if we are in direct entry, and not currently verifying external OCR data
    if (activeTab !== 'direct' || unverifiedData) return
    if (!symptoms.trim() && selectedComplaints.length === 0) return

    const delayDebounce = setTimeout(() => {
      const complaintsStr = selectedComplaints
        .map(id => COMMON_COMPLAINTS.find(c => c.id === id)?.label)
        .join(', ')
      
      const structuredSymptoms = `[Chief Complaint: ${complaintsStr || 'None'}] [Pain Severity: ${painScale}/10] [ESI Level: ${esiLevel}] [Blood Sugar: ${bloodSugar} mg/dL] ${symptoms}`
      const structuredNotes = `[Patient Profile: Age ${age}, Blood Type ${bloodType}] [ABHA ID: ${abhaId}] [PM-JAY: ${pmjayEligible}] [History: ${selectedHistory.join(', ') || 'None'}] ${notes}`
      
      const vitalsData = {
        temp,
        hr,
        spo2,
        bp: `${bpSys}/${bpDia}`,
        bloodSugar
      }

      onAnalyze(structuredSymptoms, structuredNotes, gender, vitalsData, {
        age: parseInt(age) || 28,
        gender,
        bloodType,
        esiLevel,
        painScale,
        selectedHistory,
        abhaId,
        pmjayEligible,
        bloodSugar
      })
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [symptoms, notes, gender, age, bloodType, esiLevel, painScale, selectedComplaints, selectedHistory, temp, hr, spo2, bpSys, bpDia, activeTab, unverifiedData, onAnalyze, abhaId, pmjayEligible, bloodSugar])

  // Regex clinical telemetry parser (Matches discharge notes, ER reports, dictation logs)
  const parseClinicalText = (text: string) => {
    const cleanText = text.toLowerCase()
    
    const ageMatch = text.match(/(\d{1,3})\s*(?:yo|years?\s*old|age)/i) || text.match(/age\s*:?\s*(\d{1,3})/i)
    const ageVal = ageMatch ? parseInt(ageMatch[1]) : 35

    let genderVal: 'Male' | 'Female' = 'Female'
    if (cleanText.includes('male') || cleanText.includes(' man') || cleanText.includes('gentleman')) {
      genderVal = 'Male'
    }

    const tempMatch = text.match(/temp(?:erature)?\s*:?\s*(\d{2}(?:\.\d)?)/i) || text.match(/(\d{2}(?:\.\d)?)\s*(?:°?c|degrees)/i)
    const tempVal = tempMatch ? tempMatch[1] : '37.0'

    const hrMatch = text.match(/hr|pulse|heart\s*rate\s*:?\s*(\d{2,3})/i) || text.match(/(\d{2,3})\s*(?:bpm|beats)/i)
    const hrVal = hrMatch ? hrMatch[1] : '75'

    const spo2Match = text.match(/spo2|oxygen|o2\s*:?\s*(\d{2,3})/i) || text.match(/(\d{2,3})\s*(?:%|percent)/i)
    const spo2Val = spo2Match ? spo2Match[1] : '98'

    const bpMatch = text.match(/(?:bp|blood\s*pressure)\s*:?\s*(\d{2,3})\s*\/\s*(\d{2,3})/i) || text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/i)
    const bpSysVal = bpMatch ? bpMatch[1] : '120'
    const bpDiaVal = bpMatch ? bpMatch[2] : '80'

    const painMatch = text.match(/(?:pain|severity)\s*:?\s*(\d{1,2})/i) || text.match(/(\d{1,2})\s*\/\s*10/i)
    const painVal = painMatch ? Math.min(10, parseInt(painMatch[1])) : 5

    const esiMatch = text.match(/(?:esi|triage\s*level)\s*:?\s*([1-5])/i)
    const esiVal = esiMatch ? parseInt(esiMatch[1]) : 3

    const historyVal: string[] = []
    if (cleanText.includes('hypertension') || cleanText.includes('htn') || cleanText.includes('high blood pressure')) historyVal.push('Hypertension')
    if (cleanText.includes('coronary') || cleanText.includes('cad') || cleanText.includes('heart disease')) historyVal.push('Coronary Artery Disease')
    if (cleanText.includes('asthma') || cleanText.includes('copd') || cleanText.includes('wheezing')) historyVal.push('Asthma / COPD')
    if (cleanText.includes('diabetes') || cleanText.includes('dm') || cleanText.includes('sugar')) historyVal.push('Diabetes Type II')
    if (cleanText.includes('tuberculosis') || cleanText.includes('tb')) historyVal.push('Tuberculosis History')
    if (cleanText.includes('kidney') || cleanText.includes('renal')) historyVal.push('Chronic Kidney Disease')

    // Find complaints
    const complaints: string[] = []
    if (cleanText.includes('chest pain') || cleanText.includes('myocardial') || cleanText.includes('angina')) complaints.push('chest_pain')
    if (cleanText.includes('dyspnea') || cleanText.includes('breath') || cleanText.includes('shortness')) complaints.push('dyspnea')
    if (cleanText.includes('headache') || cleanText.includes('retro-orbital') || cleanText.includes('dengue')) complaints.push('cephalalgia')
    if (cleanText.includes('abdominal') || cleanText.includes('stomach') || cleanText.includes('appendi')) complaints.push('abdominal_pain')
    if (cleanText.includes('hemoptysis') || cleanText.includes('cough with blood') || cleanText.includes('sputum')) complaints.push('hemoptysis')

    const abhaMatch = text.match(/abha(?:\s*id)?\s*:?\s*(\d{2}-\d{4}-\d{4}-\d{4})/i) || text.match(/abha\s*:?\s*(\d{14})/i)
    const abhaVal = abhaMatch ? abhaMatch[1] : ''

    const bsMatch = text.match(/(?:blood\s*sugar|sugar|rbs|fbs)\s*:?\s*(\d{2,3})/i)
    const bsVal = bsMatch ? bsMatch[1] : '100'

    const pmjayMatch = text.match(/pm-?jay\s*:?\s*(eligible|ineligible|under verification)/i)
    const pmjayVal = pmjayMatch ? (pmjayMatch[1].toLowerCase() === 'eligible' ? 'Eligible' : pmjayMatch[1].toLowerCase() === 'ineligible' ? 'Ineligible' : 'Under Verification') : 'Eligible'

    return {
      age: ageVal,
      gender: genderVal,
      bloodType: 'O+',
      esiLevel: esiVal,
      painScale: painVal,
      temp: tempVal,
      hr: hrVal,
      spo2: spo2Val,
      bpSys: bpSysVal,
      bpDia: bpDiaVal,
      selectedComplaints: complaints,
      selectedHistory: historyVal,
      symptoms: text,
      abhaId: abhaVal,
      pmjayEligible: pmjayVal,
      bloodSugar: bsVal
    }
  }

  // Trigger simulated file processing
  const handleFileUpload = (content: string) => {
    setIsScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          const parsed = parseClinicalText(content)
          setUnverifiedData(parsed)
          return 100
        }
        return p + 25
      })
    }, 150)
  }

  // Commit verified fields back to Patient profile
  const handleCommitVerification = async () => {
    if (!unverifiedData) return

    const complaintsStr = unverifiedData.selectedComplaints
      .map((id: string) => COMMON_COMPLAINTS.find(c => c.id === id)?.label)
      .join(', ')

    const structuredSymptoms = `[Chief Complaint: ${complaintsStr || 'None'}] [Pain Severity: ${unverifiedData.painScale}/10] [ESI Level: ${unverifiedData.esiLevel}] [Blood Sugar: ${unverifiedData.bloodSugar || '100'} mg/dL] ${unverifiedData.symptoms}`
    const structuredNotes = `[Patient Profile: Age ${unverifiedData.age}, Blood Type ${unverifiedData.bloodType}] [ABHA ID: ${unverifiedData.abhaId || ''}] [PM-JAY: ${unverifiedData.pmjayEligible || 'Eligible'}] [History: ${unverifiedData.selectedHistory.join(', ') || 'None'}] Verified via intake parser.`

    const vitalsData = {
      temp: unverifiedData.temp,
      hr: unverifiedData.hr,
      spo2: unverifiedData.spo2,
      bp: `${unverifiedData.bpSys}/${unverifiedData.bpDia}`,
      bloodSugar: unverifiedData.bloodSugar
    }

    await onAnalyze(structuredSymptoms, structuredNotes, unverifiedData.gender, vitalsData, {
      age: unverifiedData.age,
      gender: unverifiedData.gender,
      bloodType: unverifiedData.bloodType,
      esiLevel: unverifiedData.esiLevel,
      painScale: unverifiedData.painScale,
      selectedHistory: unverifiedData.selectedHistory,
      abhaId: unverifiedData.abhaId,
      pmjayEligible: unverifiedData.pmjayEligible,
      bloodSugar: unverifiedData.bloodSugar
    })

    // Sync form inputs locally
    setAge(unverifiedData.age.toString())
    setGender(unverifiedData.gender)
    setBloodType(unverifiedData.bloodType)
    setEsiLevel(unverifiedData.esiLevel)
    setPainScale(unverifiedData.painScale)
    setSymptoms(unverifiedData.symptoms)
    setSelectedHistory(unverifiedData.selectedHistory)
    setTemp(unverifiedData.temp)
    setHr(unverifiedData.hr)
    setSpo2(unverifiedData.spo2)
    setBpSys(unverifiedData.bpSys)
    setBpDia(unverifiedData.bpDia)
    setAbhaId(unverifiedData.abhaId || '')
    setPmjayEligible(unverifiedData.pmjayEligible || 'Eligible')
    setBloodSugar(unverifiedData.bloodSugar || '100')

    setUnverifiedData(null)
    setActiveTab('direct') // Return to direct entry to view loaded fields
  }

  // Speech dictation logic
  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.")
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setDictationText(prev => prev + (prev ? ' ' : '') + transcript)
    }
    recognition.start()
  }

  // Vitals level indicators
  const getTempAlert = (tVal: number) => {
    if (isNaN(tVal)) return { label: 'Invalid', color: 'text-slate-400 border-slate-800' }
    if (tVal < 35.0) return { label: 'Hypothermia', color: 'text-sky-400 border-sky-950/50 bg-sky-950/25' }
    if (tVal >= 35.0 && tVal <= 37.5) return { label: 'Normal', color: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/25' }
    if (tVal > 37.5 && tVal <= 38.5) return { label: 'Low Fever', color: 'text-amber-400 border-amber-950/50 bg-amber-950/25' }
    return { label: 'Hyperpyrexia', color: 'text-rose-400 border-rose-950/50 bg-rose-950/25 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold animate-pulse' }
  }

  const getHrAlert = (hrVal: number) => {
    if (isNaN(hrVal)) return { label: 'Invalid', color: 'text-slate-400 border-slate-800' }
    if (hrVal < 60) return { label: 'Bradycardia', color: 'text-sky-400 border-sky-950/50 bg-sky-950/25' }
    if (hrVal >= 60 && hrVal <= 100) return { label: 'Normal', color: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/25' }
    if (hrVal > 100 && hrVal <= 120) return { label: 'Tachycardia', color: 'text-amber-400 border-amber-950/50 bg-amber-950/25' }
    return { label: 'Critical Tachycardia', color: 'text-rose-400 border-rose-950/50 bg-rose-950/25 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold animate-pulse' }
  }

  const getSpo2Alert = (sVal: number) => {
    if (isNaN(sVal)) return { label: 'Invalid', color: 'text-slate-400 border-slate-800' }
    if (sVal >= 95) return { label: 'Normal', color: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/25' }
    if (sVal >= 90 && sVal < 95) return { label: 'Hypoxia', color: 'text-amber-400 border-amber-950/50 bg-amber-950/25' }
    return { label: 'Severe Hypoxia', color: 'text-rose-400 border-rose-950/50 bg-rose-950/25 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold animate-pulse' }
  }

  const getBpAlert = (sys: number, dia: number) => {
    if (isNaN(sys) || isNaN(dia)) return { label: 'Invalid', color: 'text-slate-400 border-slate-800' }
    if (sys < 90 || dia < 60) return { label: 'Hypotension', color: 'text-sky-400 border-sky-950/50 bg-sky-950/25' }
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/25' }
    if ((sys >= 120 && sys < 140) || (dia >= 80 && dia < 90)) return { label: 'Prehypertension', color: 'text-amber-500 border-amber-950/50 bg-amber-950/25' }
    return { label: 'Hypertension', color: 'text-rose-400 border-rose-950/50 bg-rose-950/25 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold animate-pulse' }
  }

  const toggleComplaint = (id: string) => {
    setSelectedComplaints(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleHistory = (tag: string) => {
    setSelectedHistory(prev => 
      prev.includes(tag) ? prev.filter(h => h !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="p-5 space-y-5 text-slate-200">
      {/* Tab Navigation */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 grid grid-cols-3 gap-1 font-mono text-[10px] sm:text-xs">
        <button
          type="button"
          onClick={() => { setActiveTab('direct'); setUnverifiedData(null) }}
          className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'direct' ? 'bg-slate-850 text-cyan-400 shadow border border-slate-700/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Direct Entry
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('ocr'); setUnverifiedData(null) }}
          className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ocr' ? 'bg-slate-850 text-cyan-400 shadow border border-slate-700/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Document OCR
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('dictation'); setUnverifiedData(null) }}
          className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'dictation' ? 'bg-slate-850 text-cyan-400 shadow border border-slate-700/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> paste dictation
        </button>
      </div>

      {/* Verification overlay panel (clinician verification step) */}
      {unverifiedData && (
        <div className="border border-yellow-500/40 bg-yellow-950/10 rounded-xl p-4 space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-yellow-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Review Extracted Telemetry (Unverified)</span>
            </div>
            <button 
              onClick={() => setUnverifiedData(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 uppercase">Age</label>
                <input 
                  type="number"
                  value={unverifiedData.age}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">Sex</label>
                <select 
                  value={unverifiedData.gender}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, gender: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">Blood Type</label>
                <input 
                  type="text"
                  value={unverifiedData.bloodType}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, bloodType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 uppercase">Temp</label>
                <input 
                  type="text"
                  value={unverifiedData.temp}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, temp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">HR</label>
                <input 
                  type="text"
                  value={unverifiedData.hr}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, hr: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">SpO2</label>
                <input 
                  type="text"
                  value={unverifiedData.spo2}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, spo2: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">BP (Sys/Dia)</label>
                <div className="flex gap-1 items-center">
                  <input 
                    type="text"
                    value={unverifiedData.bpSys}
                    onChange={(e) => setUnverifiedData({ ...unverifiedData, bpSys: e.target.value })}
                    className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-center"
                  />
                  <span>/</span>
                  <input 
                    type="text"
                    value={unverifiedData.bpDia}
                    onChange={(e) => setUnverifiedData({ ...unverifiedData, bpDia: e.target.value })}
                    className="w-1/2 bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-center"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 uppercase">ABHA ID</label>
                <input 
                  type="text"
                  value={unverifiedData.abhaId || ''}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, abhaId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                  placeholder="XX-XXXX-XXXX-XXXX"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">PM-JAY Status</label>
                <select 
                  value={unverifiedData.pmjayEligible || 'Eligible'}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, pmjayEligible: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                >
                  <option value="Eligible">Eligible</option>
                  <option value="Ineligible">Ineligible</option>
                  <option value="Under Verification">Under Verification</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase">Blood Sugar</label>
                <input 
                  type="text"
                  value={unverifiedData.bloodSugar || '100'}
                  onChange={(e) => setUnverifiedData({ ...unverifiedData, bloodSugar: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 p-1.5 rounded text-white"
                  placeholder="mg/dL"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase block mb-1">Chief Complaint Tags</label>
              <div className="flex flex-wrap gap-1">
                {COMMON_COMPLAINTS.map(c => {
                  const isChecked = unverifiedData.selectedComplaints.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const nextComplaints = isChecked 
                          ? unverifiedData.selectedComplaints.filter((id: string) => id !== c.id)
                          : [...unverifiedData.selectedComplaints, c.id]
                        setUnverifiedData({ ...unverifiedData, selectedComplaints: nextComplaints })
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                        isChecked ? 'bg-yellow-500/10 border-yellow-500/80 text-yellow-400 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase block mb-1">History & Comorbidities</label>
              <div className="flex flex-wrap gap-1">
                {COMORBIDITIES.map(c => {
                  const isChecked = unverifiedData.selectedHistory.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const nextHistory = isChecked 
                          ? unverifiedData.selectedHistory.filter((id: string) => id !== c)
                          : [...unverifiedData.selectedHistory, c]
                        setUnverifiedData({ ...unverifiedData, selectedHistory: nextHistory })
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                        isChecked ? 'bg-yellow-500/10 border-yellow-500/80 text-yellow-400 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 uppercase">Symptoms HPI Narrative</label>
              <textarea 
                value={unverifiedData.symptoms}
                onChange={(e) => setUnverifiedData({ ...unverifiedData, symptoms: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-white font-sans text-xs leading-relaxed"
              />
            </div>

            <Button
              type="button"
              onClick={handleCommitVerification}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold uppercase tracking-wider text-xs py-2 rounded-lg cursor-pointer"
            >
              ✓ Confirm & Commit to Patient Record
            </Button>
          </div>
        </div>
      )}

      {/* Tab content 1: Direct Entry */}
      {activeTab === 'direct' && !unverifiedData && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Section 1: Demographics */}
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2 mb-1">
              <User className="w-4 h-4 text-cyan-500" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Demographics & Triage</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Age</label>
                <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 font-bold uppercase">Yrs</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Sex</label>
                <div className="flex bg-slate-900/60 border border-slate-800 rounded-lg p-0.5 relative h-9">
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition-all duration-250 ${
                      gender === 'Male' ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`flex-1 py-1 rounded-md text-xs font-bold transition-all duration-250 ${
                      gender === 'Female' ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Blood Type</label>
                <input
                  type="text"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">ABHA ID</label>
                <input
                  type="text"
                  placeholder="XX-XXXX-XXXX-XXXX"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-slate-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">PM-JAY Scheme</label>
                <select
                  value={pmjayEligible}
                  onChange={(e) => setPmjayEligible(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-sm text-slate-100 outline-none font-mono h-[38px] bg-slate-950"
                >
                  <option value="Eligible">Eligible</option>
                  <option value="Ineligible">Ineligible</option>
                  <option value="Under Verification">Under Verification</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">ESI Triage</label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEsiLevel(level)}
                      className={`py-1.5 rounded border text-xs font-bold font-mono transition-all ${
                        esiLevel === level 
                          ? ESI_LEVELS.find(l => l.level === level)?.color 
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      L{level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">Pain scale</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painScale}
                  onChange={(e) => setPainScale(Number(e.target.value))}
                  className="w-full accent-cyan-500 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vitals */}
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/50 pb-2 mb-1">
              <Heart className="w-4 h-4 text-cyan-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Vitals Telemetry</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Temp (°C)</span>
                  <span className={`text-[8px] border px-1 rounded ${getTempAlert(Number(temp)).color}`}>
                    {getTempAlert(Number(temp)).label}
                  </span>
                </div>
                <input 
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-sm text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Heart Rate</span>
                  <span className={`text-[8px] border px-1 rounded ${getHrAlert(Number(hr)).color}`}>
                    {getHrAlert(Number(hr)).label}
                  </span>
                </div>
                <input 
                  type="number"
                  value={hr}
                  onChange={(e) => setHr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-sm text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Oxygen (SpO2)</span>
                  <span className={`text-[8px] border px-1 rounded ${getSpo2Alert(Number(spo2)).color}`}>
                    {getSpo2Alert(Number(spo2)).label}
                  </span>
                </div>
                <input 
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-sm text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Blood Pressure</span>
                  <span className={`text-[8px] border px-1 rounded ${getBpAlert(Number(bpSys), Number(bpDia)).color}`}>
                    {getBpAlert(Number(bpSys), Number(bpDia)).label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-xs text-slate-100 text-center"
                    placeholder="Sys"
                  />
                  <span>/</span>
                  <input 
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-xs text-slate-100 text-center"
                    placeholder="Dia"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl col-span-2">
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Random Blood Sugar (mg/dL)</span>
                  <span className={`text-[8px] border px-1 rounded ${
                    Number(bloodSugar) > 140 ? 'text-rose-400 border-rose-950/50 bg-rose-950/25 animate-pulse font-bold' : 'text-emerald-400 border-emerald-950/50 bg-emerald-950/25'
                  }`}>
                    {Number(bloodSugar) > 140 ? 'Hyperglycemia' : 'Normal'}
                  </span>
                </div>
                <input 
                  type="number"
                  value={bloodSugar}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-sm text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: History & narrative */}
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">Comorbidities</label>
              <div className="flex flex-wrap gap-1">
                {COMORBIDITIES.map(tag => {
                  const isSelected = selectedHistory.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleHistory(tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-500/10 border-blue-500/80 text-blue-400 font-semibold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? '✓' : '+'} {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Symptoms Narrative HPI</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe symptoms in detail..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 outline-none resize-none font-sans leading-relaxed"
                rows={3}
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab content 2: Document OCR */}
      {activeTab === 'ocr' && !unverifiedData && (
        <div className="space-y-4 font-mono text-xs">
          {/* File Upload Zone */}
          <div className="border border-dashed border-slate-800 bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
            <FileUp className="w-10 h-10 text-slate-500" />
            <div>
              <p className="font-bold text-slate-300">Drag & Drop Patient Report</p>
              <p className="text-[10px] text-slate-500 mt-1">Supports PDF, Scanned Labs, and Discharge Summaries</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              id="report-upload" 
              onChange={() => handleFileUpload("Discharge summary: 54yo male with coronary history. BP: 155/95, HR 105. Sudden chest pain.")}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('report-upload')?.click()}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs py-1.5 px-4 rounded-lg cursor-pointer"
            >
              Browse Local Files
            </Button>
          </div>

          {/* Preset Clinical Documents */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Sample Hospital Intake Presets</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleFileUpload("Cardiology ER Intake: 54yo male. Vitals: HR 105, BP 155/95, SpO2 94%, Temp 36.8C. Chief complaint: radiating crushing retrosternal chest pain and heavy diaphoresis. History of Hypertension and Coronary Artery Disease.")}
                className="w-full p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900/50 text-left transition-all"
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-500" /> Cardiology Intake Report (John Doe)
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">Discharge Summary: 54yo male with chest pain, HR 105...</p>
              </button>

              <button
                type="button"
                onClick={() => handleFileUpload("Outpatient clinic: 28yo female. Temp 38.0C, HR 88, BP 120/80, SpO2 97%. Chief complaint: severe throbbing headache, stiff neck, photophobia. History of migraines.")}
                className="w-full p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900/50 text-left transition-all"
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" /> Clinic Note - Meningitis Screen (Elena)
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">Neurological Assessment: 28yo female with stiff neck, Temp 38.0C...</p>
              </button>

              <button
                type="button"
                onClick={() => handleFileUpload("Discharge summary: 42yo female. Vitals: Temp 37.9C, HR 95, BP 130/85, SpO2 92%. Chief complaint: shortness of breath, expiratory wheeze, and severe dry cough. Medical History: Asthma / COPD.")}
                className="w-full p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-cyan-500/50 hover:bg-slate-900/50 text-left transition-all"
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" /> Pulmonology Report - Asthma Exacerbation
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">Respiratory Care: 42yo female with dyspnea, SpO2 92%...</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 3: Clinical Dictation */}
      {activeTab === 'dictation' && !unverifiedData && (
        <div className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase mb-1.5">Raw Dictation / Notes Paste</label>
            <textarea
              value={dictationText}
              onChange={(e) => setDictationText(e.target.value)}
              placeholder="Paste voice-to-text dictation notes or clinical draft..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-sans text-xs leading-relaxed outline-none resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSpeech}
              className={`flex-1 py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                isListening ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? 'Stop Listening' : 'Voice Dictate'}
            </button>
            
            <button
              type="button"
              onClick={() => handleFileUpload(dictationText)}
              disabled={!dictationText.trim()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              Extract Telemetry
            </button>
          </div>

          {/* Quick Paste Presets */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Quick Dictation Presets</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setDictationText("Pt is a 54yo male with sudden retrosternal crushing pain radiating to left shoulder. Heavy diaphoresis. Vitals: HR 105, BP 155/95, SpO2 94%, Temp 36.8C. History of Hypertension and Coronary Artery Disease.")}
                className="w-full p-2.5 bg-slate-900/30 border border-slate-850 rounded-lg text-left text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-850"
              >
                Cardiac Crisis note (54yo male, chest pain, HR 105)
              </button>
              <button
                type="button"
                onClick={() => setDictationText("28yo female presents with severe throbbing headache, high fever 38.0C, photo-sensitivity, and neck stiffness. History: Migraines.")}
                className="w-full p-2.5 bg-slate-900/30 border border-slate-850 rounded-lg text-left text-[11px] text-slate-400 hover:text-slate-200 hover:border-slate-850"
              >
                Meningitis Risk note (28yo female, stiff neck, Temp 38.0C)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Scanning State */}
      {isScanning && (
        <div className="border border-cyan-500/30 bg-cyan-950/10 rounded-xl p-5 flex flex-col items-center justify-center gap-3 font-mono text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <div className="text-center w-full">
            <p className="font-bold text-slate-200">AI Medical OCR & NLP Scanner Active</p>
            <p className="text-[10px] text-slate-500 mt-1">Extracting patient details and vitals telemetry...</p>
            {/* Progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-1 mt-3 overflow-hidden border border-slate-850">
              <div 
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
