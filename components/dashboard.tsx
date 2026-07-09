'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { BodyModel } from './body-model'
import { SymptomInput } from './symptom-input'
import { DICOMViewer } from './dicom-viewer'
import { 
  Heart, 
  Activity, 
  Search, 
  Scan, 
  Mic, 
  UserPlus, 
  Users,
  Eye, 
  CheckCircle, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Shield,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  Volume2,
  ListTodo,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface Analysis {
  predictedCondition: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  affectedRegions: Array<{
    bodyRegion: string
    confidence: 'high' | 'medium' | 'low'
    condition: string
    reasoning: string
    symptoms?: string
    relevantVitalsHistory?: string
  }>
  recommendations: string[]
  severityScore: number
  differentialDiagnosis?: Array<{
    condition: string
    confidence: number
    severity: 'high' | 'medium' | 'low'
    reasoning: string
  }>
  redFlags?: Array<{
    title: string
    description: string
    alertLevel: 'critical' | 'warning'
  }>
}

interface Patient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  symptoms: string
  notes: string
  vitals: { temp: string; hr: string; spo2: string; bp: string; resp: string }
  analysis: Analysis | null
  bloodType?: string
  esiLevel?: number
  painScale?: number
  selectedHistory?: string[]
  abhaId?: string
  pmjayEligible?: 'Eligible' | 'Ineligible' | 'Under Verification'
  bloodSugar?: string
  clinicalTimeline?: Array<{ step: string; time: string; completed: boolean }>
}

const SHIELD_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Raj Kumar',
    age: 58,
    gender: 'Male',
    symptoms: 'Patient reports sudden pain, swelling, and deformity in right wrist due to fall from two-wheeler 2 hours ago. Patient fell on outstretched hand.',
    notes: 'Prior history of moderate hypertension and occasional asthma. Blood pressure elevated.',
    vitals: { temp: '37.0', hr: '82', spo2: '98', bp: '128/82', resp: '18' },
    bloodType: 'A+',
    abhaId: '91-XXXX-XXXX-1234',
    pmjayEligible: 'Eligible',
    bloodSugar: '142',
    esiLevel: 3,
    painScale: 7,
    selectedHistory: ['Hypertension', 'Asthma / COPD'],
    clinicalTimeline: [
      { step: 'Admission', time: '08:30 AM', completed: true },
      { step: 'Vitals Recorded', time: '08:35 AM', completed: true },
      { step: 'Lab Ordered', time: '08:40 AM', completed: true },
      { step: 'Imaging Completed', time: '09:15 AM', completed: true },
      { step: 'AI Analysis', time: '09:20 AM', completed: true },
      { step: 'Doctor Review', time: '10:25 AM', completed: true },
      { step: 'Treatment Plan', time: '--:--', completed: false },
      { step: 'Discharge', time: '--:--', completed: false }
    ],
    analysis: {
      predictedCondition: 'Distal Radius Fracture (Suspected)',
      confidence: 'high',
      reasoning: 'Retrosternal or extremity trauma history combined with acute focal pain, deformity, and cortical swelling strongly indicates distal radial skeletal disruption.',
      affectedRegions: [
        { bodyRegion: 'skeletal', confidence: 'high', condition: 'Distal Radius Fracture', reasoning: 'Focal skeletal discontinuity in distal forearm.', symptoms: 'Swelling, severe pain, deformity', relevantVitalsHistory: 'Pain Scale 7/10' }
      ],
      recommendations: [
        'Load with Paracetamol 650mg + Ibuprofen 400mg SOS.',
        'Request immediate CT Reconstruction or forearm radiography.',
        'Perform Orthopedic Consultation for casting or closed reduction.',
        'Apply temporary immobilization splint to prevent dislocation.'
      ],
      severityScore: 78,
      differentialDiagnosis: [
        { condition: 'Distal Radius Fracture', confidence: 95, severity: 'high', reasoning: 'Cortical discontinuity and joint displacement observed in forearm structures.' },
        { condition: 'Wrist Joint Sprain / Ligament Tear', confidence: 40, severity: 'medium', reasoning: 'Severe soft tissue swelling without visible bone fracture.' },
        { condition: 'Colles Fracture', confidence: 85, severity: 'high', reasoning: 'Dorsal displacement typical of outpatient falls.' }
      ],
      redFlags: [
        { title: 'FRACTURE DETECTED', description: 'Immediate orthopedic casting and immobilization required to avoid neurovascular compromise.', alertLevel: 'warning' }
      ]
    }
  },
  {
    id: 'pat-2',
    name: 'Priya Sharma',
    age: 29,
    gender: 'Female',
    symptoms: 'Patient presents with high-grade fever (103°F) for 5 days, severe retro-orbital headache, generalized muscle and joint pain ("breakbone" aches), and mild petechial rashes on lower limbs.',
    notes: 'No major medical history. Living in a vector-heavy area during monsoon season.',
    vitals: { temp: '39.4', hr: '98', spo2: '97', bp: '105/70', resp: '20' },
    bloodType: 'B+',
    abhaId: '23-9081-3482-1249',
    pmjayEligible: 'Under Verification',
    bloodSugar: '95',
    esiLevel: 2,
    painScale: 8,
    selectedHistory: [],
    clinicalTimeline: [
      { step: 'Admission', time: '10:02 AM', completed: true },
      { step: 'Vitals Recorded', time: '10:05 AM', completed: true },
      { step: 'Lab Ordered', time: '10:10 AM', completed: true },
      { step: 'Imaging Completed', time: '--:--', completed: false },
      { step: 'AI Analysis', time: '10:18 AM', completed: true },
      { step: 'Doctor Review', time: '10:20 AM', completed: true },
      { step: 'Treatment Plan', time: '--:--', completed: false },
      { step: 'Discharge', time: '--:--', completed: false }
    ],
    analysis: {
      predictedCondition: 'Dengue Hemorrhagic Fever (Suspected)',
      confidence: 'high',
      reasoning: 'High-grade continuous fever, retro-orbital pain, arthralgia/myalgia (breakbone fever), and petechial rashes in an endemic tropical region point strongly to Dengue virus infection.',
      affectedRegions: [
        { bodyRegion: 'brain', confidence: 'medium', condition: 'Retro-orbital cephalalgia', reasoning: 'Severe localized retro-orbital pain secondary to systemic viral fever.', symptoms: 'Retro-orbital headache', relevantVitalsHistory: 'Fever 39.4°C (103°F)' },
        { bodyRegion: 'liver', confidence: 'medium', condition: 'Hepatomegaly risk', reasoning: 'Dengue virus often causes mild transaminitis and liver congestion.', symptoms: 'Nausea, abdominal fullness', relevantVitalsHistory: 'High-grade pyrexia' }
      ],
      recommendations: [
        'Initiate strict hydration (oral ORS / Electral) and monitor intake/output chart.',
        'Administer Paracetamol (Dolo 650mg) SOS for fever. AVOID NSAIDs (Aspirin, Ibuprofen) due to bleeding risk.',
        'Order Complete Blood Count (CBC) immediately to check platelet counts and hematocrit levels.',
        'Advise bed rest and immediate return if warning signs (bleeding, abdominal pain, persistent vomiting) develop.'
      ],
      severityScore: 70,
      differentialDiagnosis: [
        { condition: 'Dengue Fever / Dengue Hemorrhagic Fever', confidence: 90, severity: 'high', reasoning: 'Characteristic retro-orbital pain, severe joint pain, high fever, and petechiae.' },
        { condition: 'Malaria (Plasmodium falciparum)', confidence: 45, severity: 'high', reasoning: 'High-grade fever with rigors/chills; endemicity warrants peripheral blood smear confirmation.' },
        { condition: 'Enteric (Typhoid) Fever', confidence: 35, severity: 'medium', reasoning: 'Continuous fever, but bradycardia or gastrointestinal symptoms are more typical; requires Widal/Blood Culture.' }
      ],
      redFlags: [
        { title: 'THROMBOCYTOPENIA & BLEEDING RISK', description: 'Petechial rashes and high fever for 5 days. Watch for active bleeding, platelet depletion, or hematemesis.', alertLevel: 'warning' }
      ]
    }
  },
  {
    id: 'pat-3',
    name: 'Amit Patel',
    age: 58,
    gender: 'Male',
    symptoms: 'Persistent productive cough with yellowish-green sputum and occasional blood streaks (hemoptysis) for the past 3 weeks. Reports low-grade evening fever, night sweats, and unexplained weight loss of 5 kg.',
    notes: 'Prior history of moderate chronic asthma. Worked in poorly ventilated textile mills.',
    vitals: { temp: '37.8', hr: '82', spo2: '96', bp: '118/75', resp: '19' },
    bloodType: 'A-',
    abhaId: '88-4328-9843-2390',
    pmjayEligible: 'Eligible',
    bloodSugar: '110',
    esiLevel: 3,
    painScale: 4,
    selectedHistory: ['Asthma / COPD'],
    clinicalTimeline: [
      { step: 'Admission', time: '09:45 AM', completed: true },
      { step: 'Vitals Recorded', time: '09:48 AM', completed: true },
      { step: 'Lab Ordered', time: '09:50 AM', completed: true },
      { step: 'Imaging Completed', time: '10:05 AM', completed: true },
      { step: 'AI Analysis', time: '10:12 AM', completed: true },
      { step: 'Doctor Review', time: '10:15 AM', completed: true },
      { step: 'Treatment Plan', time: '--:--', completed: false },
      { step: 'Discharge', time: '--:--', completed: false }
    ],
    analysis: {
      predictedCondition: 'Pulmonary Tuberculosis (Active)',
      confidence: 'high',
      reasoning: 'Triad of chronic cough (>2 weeks), hemoptysis, low-grade evening temperature spikes, night sweats, and significant weight loss in an endemic region is highly indicative of active Pulmonary TB.',
      affectedRegions: [
        { bodyRegion: 'lungs', confidence: 'high', condition: 'Pulmonary Cavitation', reasoning: 'Mycobacterium tuberculosis infection in lung parenchymal tissue leading to chronic cough and hemoptysis.', symptoms: 'Productive cough, hemoptysis, dyspnea', relevantVitalsHistory: 'Subfebrile temperature (37.8°C), history of asthma' }
      ],
      recommendations: [
        'Order chest X-ray (PA view) and sputum smear for Acid-Fast Bacilli (AFB) / GeneXpert assay.',
        'Isolate the patient or advise double-masking to prevent airborne transmission.',
        'Refer to national DOTS (Directly Observed Treatment Short-course) center for registration and AKT-4 regimen initiation.',
        'Provide nutritional counseling and supplement with Vitamin B6 (Pyridoxine) during treatment.'
      ],
      severityScore: 65,
      differentialDiagnosis: [
        { condition: 'Pulmonary Tuberculosis', confidence: 92, severity: 'high', reasoning: 'Chronic cough for 3 weeks, evening rise of temperature, hemoptysis, and weight loss.' },
        { condition: 'Community-Acquired Pneumonia (CAP)', confidence: 40, severity: 'medium', reasoning: 'Consolidation could explain productive cough and fever, but duration and weight loss are atypical.' },
        { condition: 'Bronchogenic Carcinoma', confidence: 25, severity: 'high', reasoning: 'Chronic hemoptysis and weight loss in an older patient; requires chest CT scan to rule out.' }
      ],
      redFlags: [
        { title: 'AIRBORNE INFECTIOUS RISK', description: 'Highly suspect active Pulmonary TB. Sputum AFB confirmation and isolation protocols required.', alertLevel: 'warning' }
      ]
    }
  }
]

export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>(SHIELD_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'meds' | 'labs' | 'history'>('summary')
  const [view3DMode, setView3DMode] = useState<'axial' | 'coronal' | 'sagittal' | 'render'>('render')
  const [highlightedOrgan, setHighlightedOrgan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null) // 'Approved' | 'Rejected' | 'Modified'

  // Quick Symptom Entry States
  const [showSymptomForm, setShowSymptomForm] = useState(false)
  const [quickSymptoms, setQuickSymptoms] = useState('')
  const [quickSelectedComplaints, setQuickSelectedComplaints] = useState<string[]>([])
  const [quickVitals, setQuickVitals] = useState({
    bpSys: '120',
    bpDia: '80',
    hr: '75',
    spo2: '98',
    temp: '37.0'
  })

  // Sync quick forms when activePatient changes
  useEffect(() => {
    if (activePatient) {
      setQuickSymptoms(activePatient.symptoms || '')
      if (activePatient.vitals) {
        const [sys, dia] = (activePatient.vitals.bp || '120/80').split('/')
        setQuickVitals({
          bpSys: sys || '120',
          bpDia: dia || '80',
          hr: activePatient.vitals.hr || '75',
          spo2: activePatient.vitals.spo2 || '98',
          temp: activePatient.vitals.temp || '37.0'
        })
      }
      setQuickSelectedComplaints([])
      setShowSymptomForm(false)
    }
  }, [selectedPatientId, patients])

  const handleQuickAnalyze = async () => {
    const complaintsStr = quickSelectedComplaints
      .map(id => {
        const item = [
          { id: 'chest_pain', label: 'Chest Pain' },
          { id: 'dyspnea', label: 'Shortness of Breath' },
          { id: 'cephalalgia', label: 'Severe Headache' },
          { id: 'abdominal_pain', label: 'Abdominal Pain' },
          { id: 'high_fever', label: 'High Grade Fever' },
          { id: 'arthralgia', label: 'Joint/Muscle Pain' }
        ].find(c => c.id === id)
        return item ? item.label : ''
      })
      .filter(Boolean)
      .join(', ')

    const structuredSymptoms = `[Chief Complaint: ${complaintsStr || 'None'}] [Pain Severity: 5/10] ${quickSymptoms}`
    const structuredNotes = `[Patient Profile: Age ${activePatient?.age || 38}, Blood Type ${activePatient?.bloodType || 'O+'}] ${activePatient?.notes || ''}`
    
    const vitalsData = {
      temp: quickVitals.temp,
      hr: quickVitals.hr,
      spo2: quickVitals.spo2,
      bp: `${quickVitals.bpSys}/${quickVitals.bpDia}`,
      resp: activePatient?.vitals.resp || '16'
    }

    await handleAnalyzeSymptoms(structuredSymptoms, structuredNotes, activePatient?.gender || 'Female', vitalsData)
    setShowSymptomForm(false)
  }


  // Synchronized DICOM slice and coordinates states
  const [sliceIndex, setSliceIndex] = useState(50)
  const [dicomCrosshair, setDicomCrosshair] = useState({ x: 100, y: 100 })

  // 3D Canvas Settings
  const [opacity, setOpacity] = useState(0.85)
  const [wireframe, setWireframe] = useState(false)
  const [systems, setSystems] = useState({
    skeletal: true,
    muscular: false,
    nervous: true,
    cardiovascular: true,
    respiratory: true,
    digestive: true,
    lymphatic: false,
    integumentary: true
  })

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0]
  }, [patients, selectedPatientId])

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.abhaId && p.abhaId.includes(searchQuery))
    )
  }, [patients, searchQuery])

  const toggleSystem = (key: keyof typeof systems) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Listen for global custom events from the sidebar
  useEffect(() => {
    const handleOpenScanner = () => setIsModalOpen(true)
    window.addEventListener('open-ai-scanner', handleOpenScanner)
    
    const params = new URLSearchParams(window.location.search)
    if (params.get('triggerScanner') === 'true') {
      setIsModalOpen(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    return () => {
      window.removeEventListener('open-ai-scanner', handleOpenScanner)
    }
  }, [])

  // Handle new symptom analysis
  const handleAnalyzeSymptoms = async (
    symptoms: string, 
    notes: string, 
    gender: string,
    vitalsData?: { temp: string; hr: string; spo2: string; bp: string; resp?: string },
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
  ) => {
    setIsLoading(true)
    let analysisData = null
    const basePath = '/ai-in-healthcare'

    try {
      const response = await fetch(`${basePath}/api/analyze-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, notes, gender, vitals: vitalsData }),
      })

      if (!response.ok) throw new Error('Analysis failed')
      const data = await response.json()
      analysisData = data.analysis
    } catch (error) {
      // Fallback local rules engine
      const parseMeta = (str: string, label: string) => {
        const match = str.match(new RegExp(`\\[${label}:\\s*([^\\]]+)\\]`))
        return match ? match[1].trim() : ''
      }

      const rawText = (symptoms + ' ' + notes).toLowerCase()
      const painScaleVal = parseInt(parseMeta(symptoms, 'Pain Severity')) || 5
      const tempVal = vitalsData ? vitalsData.temp : '37.0'
      const hrVal = vitalsData ? vitalsData.hr : '80'
      const spo2Val = vitalsData ? vitalsData.spo2 : '98'
      const bpVal = vitalsData ? vitalsData.bp : '120/80'
      const respVal = vitalsData?.resp || '18'

      if (rawText.includes('chest') || rawText.includes('heart') || rawText.includes('retrosternal')) {
        analysisData = {
          predictedCondition: 'Acute Coronary Syndrome (STEMI Risk)',
          confidence: 'high' as const,
          reasoning: 'Retrosternal crushing pressure and elevated cardiovascular indicators.',
          affectedRegions: [
            { bodyRegion: 'heart', confidence: 'high' as const, condition: 'Myocardial Ischemia', reasoning: 'Coronary artery occlusion.' }
          ],
          recommendations: ['Perform immediate 12-lead ECG stat', 'Load with Aspirin 325mg', 'Establish Cath Lab routing'],
          severityScore: 92
        }
      } else if (rawText.includes('cough') || rawText.includes('tuberculosis') || rawText.includes('sputum')) {
        analysisData = {
          predictedCondition: 'Pulmonary Tuberculosis (Active)',
          confidence: 'high' as const,
          reasoning: 'Chronic productive cough with evening fever, night sweats, and weight loss.',
          affectedRegions: [
            { bodyRegion: 'lungs', confidence: 'high' as const, condition: 'Pulmonary Cavitation', reasoning: 'M. tuberculosis infection.' }
          ],
          recommendations: ['Order Chest X-ray (PA)', 'Sputum AFB Smear', 'Initiate DOTS AKT-4 regimen'],
          severityScore: 65
        }
      } else {
        analysisData = {
          predictedCondition: 'Dengue Hemorrhagic Fever',
          confidence: 'high' as const,
          reasoning: 'High fever, severe arthralgia, retro-orbital headache, and petechiae.',
          affectedRegions: [
            { bodyRegion: 'brain', confidence: 'medium' as const, condition: 'Focal retro-orbital cephalalgia', reasoning: 'Viral retro-orbital inflammation.' },
            { bodyRegion: 'liver', confidence: 'medium' as const, condition: 'Hepatomegaly risk', reasoning: 'Secondary systemic viral stress.' }
          ],
          recommendations: ['Strict hydration (ORS)', 'Administer Paracetamol (Dolo 650mg)', 'Avoid NSAIDs'],
          severityScore: 70
        }
      }
    }

    if (analysisData) {
      setPatients(prev => prev.map(p => {
        if (p.id === selectedPatientId) {
          return {
            ...p,
            symptoms,
            notes,
            vitals: {
              temp: vitalsData?.temp || p.vitals.temp,
              hr: vitalsData?.hr || p.vitals.hr,
              spo2: vitalsData?.spo2 || p.vitals.spo2,
              bp: vitalsData?.bp || p.vitals.bp,
              resp: vitalsData?.resp || p.vitals.resp
            },
            analysis: analysisData,
            ...(patientUpdates ? {
              age: patientUpdates.age,
              gender: patientUpdates.gender,
              bloodType: patientUpdates.bloodType,
              esiLevel: patientUpdates.esiLevel,
              painScale: patientUpdates.painScale,
              selectedHistory: patientUpdates.selectedHistory,
              abhaId: patientUpdates.abhaId,
              pmjayEligible: patientUpdates.pmjayEligible,
              bloodSugar: patientUpdates.bloodSugar
            } : {})
          }
        }
        return p
      }))
      setApprovalStatus(null) // reset approval state for new analysis
      setIsModalOpen(false)   // close scanner dialog
    }
    setIsLoading(false)
  }

  // Merged body region highlights
  const activeRegions = useMemo(() => {
    const regions = [...(activePatient?.analysis?.affectedRegions || [])]
    if (highlightedOrgan) {
      regions.push({
        bodyRegion: highlightedOrgan,
        confidence: 'high',
        condition: 'Focus Inspection active',
        reasoning: `Targeting the ${highlightedOrgan} for manual structural examination.`
      })
    }
    return regions
  }, [activePatient, highlightedOrgan])

  const handleAddNewPatientRecord = () => {
    const name = prompt("Enter patient full name:")
    if (!name) return
    const abhaInput = prompt("Enter ABHA ID (e.g. 91-0000-0000-0000):") || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name,
      age: 38,
      gender: 'Male',
      symptoms: 'No active symptoms described.',
      notes: 'New clinical registry created.',
      vitals: { temp: '36.8', hr: '74', spo2: '98', bp: '120/80', resp: '16' },
      abhaId: abhaInput,
      pmjayEligible: 'Eligible',
      bloodSugar: '108',
      clinicalTimeline: [
        { step: 'Admission', time: '10:30 AM', completed: true },
        { step: 'Vitals Recorded', time: '10:35 AM', completed: true },
        { step: 'Lab Ordered', time: '--:--', completed: false },
        { step: 'Imaging Completed', time: '--:--', completed: false },
        { step: 'AI Analysis', time: '--:--', completed: false },
        { step: 'Doctor Review', time: '--:--', completed: false },
        { step: 'Treatment Plan', time: '--:--', completed: false },
        { step: 'Discharge', time: '--:--', completed: false }
      ],
      analysis: null
    }

    setPatients(prev => [...prev, newPatient])
    setSelectedPatientId(newPatient.id)
    setIsModalOpen(true) // Open scan input right away for the new patient
  }

  return (
    <div className="w-full h-full bg-[#020617] text-gray-100 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden select-none font-sans">
      
      {/* 1. LEFT COLUMN: Patient Navigator (Width 22%) */}
      <div className="w-full lg:w-[22%] flex flex-col gap-4 bg-[#070d19]/45 border border-slate-900/60 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        
        {/* Search & Add Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Patient Registry
            </span>
            <button 
              onClick={handleAddNewPatientRecord}
              className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/40 transition text-cyan-400 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ABHA ID / Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/60 border border-slate-800/60 rounded-xl text-xs outline-none focus:border-cyan-500/40 transition text-gray-300 font-mono"
            />
          </div>
        </div>

        {/* Patient Queue List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredPatients.map(p => {
            const isSelected = p.id === selectedPatientId
            const activeDiag = p.analysis?.predictedCondition || 'Unanalyzed'
            
            let severityTag = 'bg-sky-950/40 border-sky-500/20 text-sky-400'
            let severityLabel = 'Low'
            if (p.analysis && p.analysis.severityScore > 75) {
              severityTag = 'bg-rose-950/40 border-rose-500/20 text-rose-400 animate-pulse font-bold'
              severityLabel = 'Critical'
            } else if (p.analysis && p.analysis.severityScore > 50) {
              severityTag = 'bg-orange-950/40 border-orange-500/20 text-orange-400 font-bold'
              severityLabel = 'High'
            } else if (p.analysis) {
              severityTag = 'bg-amber-950/40 border-amber-500/20 text-amber-400'
              severityLabel = 'Medium'
            }

            return (
              <div 
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex justify-between items-start ${
                  isSelected 
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.08)]' 
                    : 'bg-black/20 border-slate-900/60 hover:bg-slate-900/20'
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                  <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wide truncate">
                    {p.age} Y / {p.gender[0]} | {activeDiag}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 font-mono text-[9px] shrink-0">
                  <span className="text-slate-500 text-[8px]">10:15 AM</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] border uppercase ${severityTag}`}>
                    {severityLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. CENTER COLUMN: 3D Visualization & DICOM (Width 43%) */}
      <div className="w-full lg:w-[43%] flex flex-col gap-4 overflow-hidden">
        
        {/* 3D Viewport Panel */}
        <div className="flex-1 bg-[#070d19]/45 border border-slate-900/60 rounded-2xl overflow-hidden shadow-xl flex flex-col relative min-h-[350px] backdrop-blur-md">
          {/* Viewport Header */}
          <div className="bg-black/35 px-4 py-3 border-b border-slate-900/60 flex justify-between items-center z-10">
            <span className="font-bold text-xs tracking-wider uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
              🦴 3D Human Anatomy Visualizer
            </span>
            <Link 
              href="/view-skeletal"
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all text-[9px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.1)] pointer-events-auto"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Skeletal Only
            </Link>
          </div>

          {/* Floating Layers Panel (Glassmorphic) */}
          <div className="absolute left-4 top-16 z-20 flex flex-col gap-1 pointer-events-auto bg-slate-950/75 backdrop-blur-md border border-slate-900/50 rounded-xl p-2.5 font-mono text-[9px] shadow-lg">
            <span className="text-slate-500 font-bold block mb-1 text-[8px] border-b border-slate-900/40 pb-1 uppercase">Layers</span>
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
                  className={`px-2 py-1.5 rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer w-full ${
                    isActive ? 'bg-cyan-950/45 border border-cyan-500/30 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={() => {}}
                    className="w-3 h-3 rounded border-cyan-500/30 text-cyan-500 focus:ring-0 bg-transparent cursor-pointer accent-cyan-500 pointer-events-none"
                  />
                  <span>{sys.label}</span>
                </button>
              )
            })}

            <span className="text-slate-500 font-bold block mt-2 mb-1 text-[8px] border-b border-slate-900/40 pb-1 uppercase">Anomalies</span>
            <button
              onClick={() => {
                setWireframe(!wireframe)
                setSystems(prev => ({ ...prev, skeletal: true, digestive: true }))
              }}
              className={`px-2 py-1.5 rounded-lg text-left transition-all flex justify-between items-center cursor-pointer ${
                wireframe ? 'bg-rose-950/50 border border-rose-500/30 text-rose-400 font-bold animate-pulse' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Fracture / Tumor</span>
              <span className={`w-1.5 h-1.5 rounded-full ${wireframe ? 'bg-rose-500' : 'bg-slate-700'}`} />
            </button>
          </div>

          {/* Actual 3D Canvas element viewport */}
          <div className="flex-1 w-full min-h-[300px] relative z-0">
            <BodyModel 
              affectedRegions={activeRegions} 
              opacity={opacity} 
              wireframe={wireframe}
              activeSystems={systems}
              patientId={selectedPatientId}
            />
          </div>

          {/* View presets tabs on bottom of viewport */}
          <div className="absolute bottom-[210px] left-1/2 -translate-x-1/2 z-25 bg-slate-950/75 backdrop-blur-md border border-slate-900/50 rounded-xl p-1 flex gap-1 font-mono text-[9px] pointer-events-auto shadow-lg">
            {[
              { id: 'axial', label: 'CT Axial' },
              { id: 'coronal', label: 'CT Coronal' },
              { id: 'sagittal', label: 'CT Sagittal' },
              { id: 'render', label: '3D Render' }
            ].map(m => {
              const isSelected = view3DMode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setView3DMode(m.id as any)
                    if (m.id === 'axial') { setOpacity(0.1); setWireframe(true) }
                    else if (m.id === 'coronal') { setOpacity(0.2); setWireframe(true) }
                    else if (m.id === 'sagittal') { setOpacity(0.3); setWireframe(true) }
                    else { setOpacity(0.85); setWireframe(false) }
                  }}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Synchronized 2D DICOM slices grid */}
          <div className="p-3 border-t border-slate-900/60 bg-black/25 z-10">
            <DICOMViewer 
              patientId={selectedPatientId}
              patientName={activePatient?.name || 'Unknown Patient'}
              sliceIndex={sliceIndex}
              onSliceChange={setSliceIndex}
              crosshair={dicomCrosshair}
              onCrosshairChange={setDicomCrosshair}
            />
          </div>
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Clinician Workspace (Width 35%) */}
      <div className="w-full lg:w-[35%] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
        
        {/* Patient Profile Card Header */}
        {activePatient && (
          <div className="bg-[#070d19]/45 border border-cyan-500/20 p-4 rounded-2xl shadow-xl flex justify-between items-center relative overflow-hidden backdrop-blur-md shrink-0">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                {activePatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{activePatient.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{activePatient.age} Y / {activePatient.gender[0]}</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                  ABHA: <span className="text-cyan-400 font-bold">{activePatient.abhaId || 'N/A'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setApprovalStatus(approvalStatus === 'Approved' ? null : 'Approved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition uppercase cursor-pointer border ${
                approvalStatus === 'Approved' 
                  ? 'bg-green-950/60 border-green-500/30 text-green-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              {approvalStatus === 'Approved' ? '✓ Verified' : 'Verify'}
            </button>
          </div>
        )}

        {/* Diagnostic Insights / Symptom Form Console */}
        {activePatient && activePatient.analysis && !showSymptomForm ? (
          <div className="bg-[#070d19]/45 border border-slate-900/60 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-900/40 pb-2">
              <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> AI Diagnostics Console
              </span>
              <button
                onClick={() => setShowSymptomForm(true)}
                className="px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-[9px] font-mono font-bold text-cyan-400 cursor-pointer"
              >
                New Analysis
              </button>
            </div>

            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Primary Suspected Condition</span>
              <h3 className="text-base font-black text-white uppercase tracking-wide mt-1 flex items-center gap-2">
                {activePatient.analysis.predictedCondition}
                <span className="text-[9px] font-mono text-green-400 bg-green-950/30 px-2 py-0.5 rounded-md border border-green-950/50">
                  {activePatient.analysis.confidence === 'high' ? '90%+' : activePatient.analysis.confidence === 'medium' ? '70%+' : '50%+'}
                </span>
              </h3>
            </div>

            {/* Recommendations checklist */}
            <div className="space-y-2 text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-slate-900">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Standard Treatment Directives</div>
              {activePatient.analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-2 items-start leading-relaxed text-[11px]">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            {/* Vitals HUD */}
            <div className="grid grid-cols-5 gap-2 border-t border-slate-900/40 pt-3 mt-1 font-mono text-center">
              <div className="bg-black/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-0.5">
                <span className="text-[7px] text-gray-500 uppercase">BP</span>
                <span className="text-[10px] font-bold text-rose-500">{activePatient.vitals.bp}</span>
                <span className="text-[6px] text-gray-600">mmHg</span>
              </div>
              <div className="bg-black/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-0.5">
                <span className="text-[7px] text-gray-500 uppercase">HR</span>
                <span className="text-[10px] font-bold text-green-500">{activePatient.vitals.hr}</span>
                <span className="text-[6px] text-gray-600">bpm</span>
              </div>
              <div className="bg-black/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-0.5">
                <span className="text-[7px] text-gray-500 uppercase">SpO2</span>
                <span className="text-[10px] font-bold text-blue-500">{activePatient.vitals.spo2}%</span>
                <span className="text-[6px] text-gray-600">index</span>
              </div>
              <div className="bg-black/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-0.5">
                <span className="text-[7px] text-gray-500 uppercase">Temp</span>
                <span className="text-[10px] font-bold text-amber-500">{activePatient.vitals.temp}°C</span>
                <span className="text-[6px] text-gray-600">oral</span>
              </div>
              <div className="bg-black/30 border border-slate-900 p-2 rounded-xl flex flex-col gap-0.5">
                <span className="text-[7px] text-gray-500 uppercase">Resp</span>
                <span className="text-[10px] font-bold text-purple-500">{activePatient.vitals.resp || '18'}</span>
                <span className="text-[6px] text-gray-600">/min</span>
              </div>
            </div>

            {/* Red Flags / Warnings */}
            {activePatient.analysis.redFlags && activePatient.analysis.redFlags.length > 0 && (
              <div className="space-y-2 text-[10px] font-mono">
                {activePatient.analysis.redFlags.map((flag, idx) => (
                  <div key={idx} className="flex gap-2.5 items-center p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block">{flag.title}</span>
                      <span className="text-slate-300 text-[9px] mt-0.5 block">{flag.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#070d19]/45 border border-slate-900/60 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-slate-900/40 pb-2">
              <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
                📋 AI Diagnostics Intake
              </span>
              {activePatient && activePatient.analysis && (
                <button
                  onClick={() => setShowSymptomForm(false)}
                  className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-[9px] font-mono text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 font-mono text-[10px]">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 uppercase">Symptoms Description:</span>
                <textarea
                  rows={4}
                  placeholder="Enter patient symptoms here (e.g. crushing chest pain, cough, high fever...)"
                  value={quickSymptoms}
                  onChange={(e) => setQuickSymptoms(e.target.value)}
                  className="w-full bg-black/60 border border-slate-800/60 rounded-xl p-2.5 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50 resize-none custom-scrollbar"
                />
              </div>

              {/* Quick Select Symptoms */}
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 uppercase">Common Complaints:</span>
                <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                  {[
                    { id: 'chest_pain', label: 'Chest Pain' },
                    { id: 'dyspnea', label: 'Shortness of Breath' },
                    { id: 'cephalalgia', label: 'Severe Headache' },
                    { id: 'abdominal_pain', label: 'Abdominal Pain' },
                    { id: 'high_fever', label: 'High Grade Fever' },
                    { id: 'arthralgia', label: 'Joint/Muscle Pain' }
                  ].map(c => {
                    const isChecked = quickSelectedComplaints.includes(c.id)
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 font-bold' : 'bg-black/20 border-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setQuickSelectedComplaints(prev => prev.filter(id => id !== c.id))
                            } else {
                              setQuickSelectedComplaints(prev => [...prev, c.id])
                            }
                          }}
                          className="w-3 h-3 rounded border-slate-700 text-cyan-500 focus:ring-0 bg-transparent cursor-pointer accent-cyan-500"
                        />
                        <span className="text-[9px] truncate">{c.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Vitals Grid Inputs */}
              <div className="flex flex-col gap-1 border-t border-slate-900/40 pt-2.5">
                <span className="text-slate-400 uppercase">Input Vitals:</span>
                <div className="grid grid-cols-4 gap-1.5 mt-0.5 text-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-gray-500 uppercase">BP SYS</span>
                    <input 
                      type="text" 
                      value={quickVitals.bpSys} 
                      onChange={(e) => setQuickVitals(prev => ({ ...prev, bpSys: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-800/60 rounded-lg py-1 text-center text-rose-400 font-bold text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-gray-500 uppercase">BP DIA</span>
                    <input 
                      type="text" 
                      value={quickVitals.bpDia} 
                      onChange={(e) => setQuickVitals(prev => ({ ...prev, bpDia: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-800/60 rounded-lg py-1 text-center text-rose-400 font-bold text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-gray-500 uppercase">HR (BPM)</span>
                    <input 
                      type="text" 
                      value={quickVitals.hr} 
                      onChange={(e) => setQuickVitals(prev => ({ ...prev, hr: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-800/60 rounded-lg py-1 text-center text-green-400 font-bold text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-gray-500 uppercase">SpO2 (%)</span>
                    <input 
                      type="text" 
                      value={quickVitals.spo2} 
                      onChange={(e) => setQuickVitals(prev => ({ ...prev, spo2: e.target.value }))}
                      className="w-full bg-black/60 border border-slate-800/60 rounded-lg py-1 text-center text-blue-400 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Map Button */}
              <button
                onClick={handleQuickAnalyze}
                disabled={isLoading || (!quickSymptoms.trim() && quickSelectedComplaints.length === 0)}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition font-mono text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-1.5 cursor-pointer border border-transparent"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    MAPPING ANATOMY...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    RUN ANATOMY MAPPING
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Detailed EHR Tabs */}
        {activePatient && (
          <div className="bg-[#070d19]/45 border border-slate-900/60 rounded-2xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-md">
            <div className="flex border-b border-slate-900/40 gap-3 text-[10px] font-mono font-bold">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`pb-1.5 cursor-pointer uppercase transition-all \${activeTab === 'summary' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab('meds')}
                className={`pb-1.5 cursor-pointer uppercase transition-all \${activeTab === 'meds' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Meds
              </button>
              <button 
                onClick={() => setActiveTab('labs')}
                className={`pb-1.5 cursor-pointer uppercase transition-all \${activeTab === 'labs' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Labs
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`pb-1.5 cursor-pointer uppercase transition-all \${activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                History
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-[140px] text-xs">
              {activeTab === 'summary' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">HPI Narrative</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {activePatient.symptoms.replace(/\[[^\]]+\]/g, '').trim() || 'No active symptoms.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                    <div className="bg-black/30 border border-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block uppercase">Blood Type</span>
                      <span className="text-white font-bold">{activePatient.bloodType || 'O+'}</span>
                    </div>
                    <div className="bg-black/30 border border-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block uppercase">ESI Level</span>
                      <span className="text-rose-400 font-bold">Level {activePatient.esiLevel || 3}</span>
                    </div>
                    <div className="bg-black/30 border border-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block uppercase">Blood Sugar</span>
                      <span className="text-cyan-400 font-bold">{activePatient.bloodSugar || 'N/A'} mg/dL</span>
                    </div>
                    <div className="bg-black/30 border border-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500 block uppercase">Pain Scale</span>
                      <span className="text-white font-bold">{activePatient.painScale || 5}/10</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="font-mono text-[10px] space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2.5 bg-black/40 border border-slate-900 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-200">Paracetamol 650mg</div>
                        <div className="text-[8px] text-slate-500 mt-0.5">Analgesic SOS</div>
                      </div>
                      <span className="bg-rose-950/40 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-[8px]">SOS</span>
                    </div>
                    {activePatient.id === 'pat-1' ? (
                      <div className="p-2.5 bg-black/40 border border-slate-900 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-200">Ibuprofen 400mg</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">Anti-inflammatory BD</div>
                        </div>
                        <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[8px]">BD</span>
                      </div>
                    ) : activePatient.id === 'pat-3' ? (
                      <div className="p-2.5 bg-black/40 border border-slate-900 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-200">AKT-4 Regimen Kit</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">Anti-Tubercular DOTS OD</div>
                        </div>
                        <span className="bg-green-950/40 border border-green-500/20 text-green-400 px-2 py-0.5 rounded text-[8px]">OD</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-black/40 border border-slate-900 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-200">ORS Hydration Salts</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">Rehydration Fluid SOS</div>
                        </div>
                        <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[8px]">SOS</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="font-mono text-[10px] space-y-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-slate-900">
                      <span className="text-slate-500">RBS Assay</span>
                      <span className="text-cyan-400 font-bold">{activePatient.bloodSugar || '108'} mg/dL</span>
                    </div>
                    {activePatient.id === 'pat-1' && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-slate-900">
                        <span className="text-slate-500">X-Ray Forearm AP/LAT</span>
                        <span className="text-rose-400 font-bold">Radial Fracture</span>
                      </div>
                    )}
                    {activePatient.id === 'pat-2' && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-slate-900">
                        <span className="text-slate-500">CBC Assay</span>
                        <span className="text-rose-400 font-bold">Platelets: 92k (Thrombopenia)</span>
                      </div>
                    )}
                    {activePatient.id === 'pat-3' && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-slate-900">
                        <span className="text-slate-500">Sputum AFB Stain</span>
                        <span className="text-rose-400 font-bold">AFB Positive (3+)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="font-mono text-[10px]">
                  {activePatient.selectedHistory && activePatient.selectedHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.selectedHistory.map((h, i) => (
                        <div key={i} className="px-2.5 py-1 rounded bg-[#070d19] border border-slate-800 text-slate-300 font-semibold">
                          {h}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 p-3 text-center border border-dashed border-slate-800 rounded-lg">
                      No comorbidities in EMR Central.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DETAILED DIALOG MODAL FOR CLINICAL INTAKE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#070d19] border border-slate-800 rounded-2xl w-full max-w-[480px] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/40 px-5 py-4 border-b border-slate-900/60 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-cyan-400 font-mono tracking-wide uppercase">AI Clinical Intake</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Parameters submission for 3D coordinate mapping.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <SymptomInput 
                onAnalyze={handleAnalyzeSymptoms} 
                isLoading={isLoading} 
                activePatient={activePatient} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

}