'use client'

import { useState, useMemo, useEffect } from 'react'
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
    <div className="w-full h-full p-6 bg-[#020617] text-gray-100 flex flex-col gap-4 overflow-y-auto select-none font-sans custom-scrollbar">
      
      {/* HEADER ROW 1: Search Patient & Active Profile Banner */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* Patient Search panel (Col span 5) */}
        <div className="lg:col-span-5 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-3 flex items-center justify-between shadow-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ABHA ID / UHID / Name / Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-black/60 border border-blue-950/40 rounded-lg text-xs outline-none focus:border-cyan-500/40 transition text-gray-300 font-mono"
            />
          </div>
          <div className="flex gap-1.5 ml-3">
            <button 
              title="Barcode Scan"
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5" />
            </button>
            <button 
              title="Voice Search"
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 transition text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleAddNewPatientRecord}
              className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold px-3 py-2 rounded bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/40 transition text-cyan-400 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Patient
            </button>
          </div>
        </div>

        {/* Space (Col span 1) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* Selected Patient EHR widget (Col span 6) */}
        {activePatient && (
          <div className="lg:col-span-6 bg-[#091026]/40 border border-cyan-500/20 p-3 px-5 rounded-xl shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                {activePatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{activePatient.name}</span>
                  <span className="text-[9px] font-mono text-slate-400">{activePatient.age} Y / {activePatient.gender[0]}</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                  UHID: <span className="text-gray-300 font-bold mr-3">GH-{activePatient.id.split('-')[1] || '124578'}</span>
                  ABHA: <span className="text-cyan-400 font-bold">{activePatient.abhaId || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 font-mono text-[9px] items-center">
              <div className="text-right">
                <div className="text-gray-500 text-[8px] uppercase">IPD Registration</div>
                <div className="text-slate-200 font-bold uppercase">IP{activePatient.id.split('-')[1] || '56214'}</div>
              </div>
              <button 
                onClick={() => setApprovalStatus(approvalStatus === 'Approved' ? null : 'Approved')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold transition uppercase cursor-pointer border ${
                  approvalStatus === 'Approved' 
                    ? 'bg-green-950/60 border-green-500/30 text-green-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {approvalStatus === 'Approved' ? '✓ Verified' : 'View Profile'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HEADER ROW 2: Metrics Strip Widget */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 font-mono text-[10px] text-slate-400">
        
        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">OPD Patients</div>
            <div className="text-sm font-bold text-white leading-tight">684 <span className="text-[8px] font-normal text-slate-500">Today</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 animate-pulse">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">Emergency</div>
            <div className="text-sm font-bold text-red-500 leading-tight">32 <span className="text-[8px] font-normal text-slate-500">Active</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">Inpatients</div>
            <div className="text-sm font-bold text-white leading-tight">412 <span className="text-[8px] font-normal text-slate-500">Wards</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">ICU Occupancy</div>
            <div className="text-sm font-bold text-amber-500 leading-tight">89% <span className="text-[8px] font-normal text-slate-500">Capacity</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">Radiology Pending</div>
            <div className="text-sm font-bold text-white leading-tight">21 <span className="text-[8px] font-normal text-slate-500">Reports</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">Lab Pending</div>
            <div className="text-sm font-bold text-white leading-tight">15 <span className="text-[8px] font-normal text-slate-500">Samples</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">AI Avg. Time</div>
            <div className="text-sm font-bold text-white leading-tight">2.1s <span className="text-[8px] font-normal text-slate-500">Per analysis</span></div>
          </div>
        </div>

        <div className="p-3 bg-[#091026]/30 border border-blue-950/40 rounded-xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-green-950/40 border border-green-500/30 flex items-center justify-center text-green-400">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[8px] text-gray-500 uppercase">AI Clinical Conf.</div>
            <div className="text-sm font-bold text-green-500 leading-tight">97.6% <span className="text-[8px] font-normal text-slate-500">Average</span></div>
          </div>
        </div>

      </div>

      {/* MAIN WORKSPACE ROW 3: Three Columns split */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch min-h-[500px]">
        
        {/* COLUMN 1: Recent Patient Queue (Col span 3) */}
        <div className="lg:col-span-3 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex justify-between items-center border-b border-blue-950/40 pb-2 mb-1">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Recent Patient Queue
            </span>
            <span className="text-[9px] font-mono text-cyan-500 uppercase cursor-pointer hover:underline">View All</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredPatients.map(p => {
              const isSelected = p.id === selectedPatientId
              const activeDiag = p.analysis?.predictedCondition || 'Unanalyzed'
              
              let severityTag = 'bg-sky-950/50 border-sky-500/30 text-sky-400'
              let severityLabel = 'Low'
              if (p.analysis && p.analysis.severityScore > 75) {
                severityTag = 'bg-rose-950/50 border-rose-500/30 text-rose-400 animate-pulse font-bold'
                severityLabel = 'Critical'
              } else if (p.analysis && p.analysis.severityScore > 50) {
                severityTag = 'bg-orange-950/50 border-orange-500/30 text-orange-400 font-bold'
                severityLabel = 'High'
              } else if (p.analysis) {
                severityTag = 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                severityLabel = 'Medium'
              }

              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 flex justify-between items-start ${
                    isSelected 
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                      : 'bg-black/30 border-blue-950/40 hover:bg-slate-900/20'
                  }`}
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-xs text-white truncate">{p.name}</h4>
                    <div className="text-[9px] text-slate-400 uppercase font-mono tracking-wide truncate">
                      {p.age} Y / {p.gender[0]} | {activeDiag.split(' ')[0]}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 font-mono text-[9px] shrink-0">
                    <span className="text-slate-500 text-[8px] uppercase">10:15 AM</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] border uppercase ${severityTag}`}>
                      {severityLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* COLUMN 2: 3D Anatomy Frame (Col span 5) */}
        <div className="lg:col-span-5 bg-[#091026]/40 border border-blue-950/65 rounded-xl overflow-hidden shadow-xl flex flex-col relative min-h-[450px]">
          
          {/* Header */}
          <div className="bg-black/40 px-4 py-2.5 border-b border-blue-950/65 flex justify-between items-center z-10">
            <span className="font-bold text-xs tracking-wider uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
              🦴 3D Human Anatomy - Patient Specific
            </span>
          </div>

          {/* Controls overlay (Skin, Skeleton, Muscles, Organs, Vessels, Nerves, Tumor, Fracture) */}
          <div className="absolute left-4 top-16 z-20 flex flex-col gap-1 pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-blue-950/50 rounded-lg p-2 font-mono text-[9px]">
            <span className="text-slate-500 font-bold block mb-1 text-[8px] border-b border-blue-950/30 pb-0.5 uppercase">Layers</span>
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
                  className={`px-2 py-1 rounded text-left transition-colors flex justify-between items-center gap-4 cursor-pointer ${
                    isActive ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{sys.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                </button>
              )
            })}

            <span className="text-slate-500 font-bold block mt-2 mb-1 text-[8px] border-b border-blue-950/30 pb-0.5 uppercase">Anomalies</span>
            <button
              onClick={() => {
                setWireframe(!wireframe)
                setSystems(prev => ({ ...prev, skeletal: true, digestive: true }))
              }}
              className={`px-2 py-1 rounded text-left transition-colors flex justify-between items-center cursor-pointer ${
                wireframe ? 'bg-rose-950/60 border border-rose-500/30 text-rose-400 font-bold animate-pulse' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Fracture / Tumor</span>
              <span className={`w-1.5 h-1.5 rounded-full ${wireframe ? 'bg-rose-500' : 'bg-slate-700'}`} />
            </button>
          </div>

          {/* Actual 3D Canvas element viewport */}
          <div className="flex-1 w-full min-h-[350px] relative z-0">
            <BodyModel 
              affectedRegions={activeRegions} 
              opacity={opacity} 
              wireframe={wireframe}
              activeSystems={systems}
              patientId={selectedPatientId}
            />
          </div>

          {/* View presets tabs on bottom of viewport */}
          <div className="absolute bottom-[230px] left-1/2 -translate-x-1/2 z-25 bg-slate-950/80 backdrop-blur-md border border-blue-950/50 rounded-lg p-1 flex gap-1 font-mono text-[9px] pointer-events-auto">
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
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    isSelected ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Synchronized 2D DICOM slices grid */}
          <div className="p-3 border-t border-blue-950/60 bg-black/25 z-10">
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

        {/* COLUMN 3: AI Clinical Insights, vitals, alerts (Col span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* AI Clinical Insights card */}
          {activePatient && activePatient.analysis ? (
            <div className="bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex flex-col gap-3 shadow-lg flex-1">
              <div className="flex justify-between items-center border-b border-blue-950/40 pb-2">
                <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider font-mono flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> AI Clinical Insights
                </span>
                <span className="text-[10px] font-mono text-green-500 font-bold">Confidence: 98.3%</span>
              </div>

              <div>
                <div className="text-[9px] font-mono text-slate-500 uppercase">Likely Diagnosis</div>
                <h3 className="text-base font-black text-white uppercase tracking-wide mt-0.5">
                  {activePatient.analysis.predictedCondition}
                </h3>
              </div>

              {/* Evidence Bullet Points */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-1">Evidence Mapped</div>
                {activePatient.analysis.recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="flex gap-2 items-start leading-relaxed">
                    <span className="text-green-500 mt-0.5 font-bold">✓</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* Vitals Telemetry strip */}
              <div className="grid grid-cols-5 gap-2 border-t border-blue-950/40 pt-3 mt-1 font-mono text-center">
                <div className="bg-black/40 border border-slate-900 p-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-[7px] text-gray-500 uppercase">BP</span>
                  <span className="text-[10px] font-bold text-rose-500">{activePatient.vitals.bp}</span>
                  <span className="text-[6px] text-gray-600">mmHg</span>
                </div>
                <div className="bg-black/40 border border-slate-900 p-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-[7px] text-gray-500 uppercase">HR</span>
                  <span className="text-[10px] font-bold text-green-500">{activePatient.vitals.hr}</span>
                  <span className="text-[6px] text-gray-600">bpm</span>
                </div>
                <div className="bg-black/40 border border-slate-900 p-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-[7px] text-gray-500 uppercase">SpO2</span>
                  <span className="text-[10px] font-bold text-blue-500">{activePatient.vitals.spo2}%</span>
                  <span className="text-[6px] text-gray-600">index</span>
                </div>
                <div className="bg-black/40 border border-slate-900 p-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-[7px] text-gray-500 uppercase">Temp</span>
                  <span className="text-[10px] font-bold text-amber-500">{activePatient.vitals.temp}°C</span>
                  <span className="text-[6px] text-gray-600">oral</span>
                </div>
                <div className="bg-black/40 border border-slate-900 p-1.5 rounded flex flex-col gap-0.5">
                  <span className="text-[7px] text-gray-500 uppercase">Resp</span>
                  <span className="text-[10px] font-bold text-purple-500">{activePatient.vitals.resp || '18'}</span>
                  <span className="text-[6px] text-gray-600">/min</span>
                </div>
              </div>

              {/* Clinical Alerts list */}
              <div className="space-y-2 mt-2 pt-2 border-t border-blue-950/40 text-[10px] font-mono">
                <div className="text-[8px] text-gray-500 uppercase tracking-wide">Clinical Warnings & Alerts</div>
                {activePatient.analysis.redFlags?.map((flag, idx) => (
                  <div key={idx} className="flex gap-2 items-center p-2 rounded bg-red-950/20 border border-red-500/20 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse shrink-0" />
                    <span className="font-bold tracking-wide">{flag.title}:</span>
                    <span className="text-slate-300 truncate">{flag.description}</span>
                  </div>
                ))}
                {(!activePatient.analysis.redFlags || activePatient.analysis.redFlags.length === 0) && (
                  <div className="flex gap-2 items-center p-2 rounded bg-green-950/20 border border-green-500/20 text-green-400">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Vitals Sync Stable - No Active Red Flags detected.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#091026]/40 border border-blue-950/65 rounded-xl p-6 flex flex-col justify-center items-center text-center gap-3 shadow-lg flex-1 font-mono text-xs text-slate-500">
              <AlertCircle className="w-10 h-10 text-cyan-500/40 animate-pulse" />
              <span>No clinical insights available. Launch a new symptom scan to generate telemetry.</span>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM ROW 4: Clinical Timeline & Doctor Actions split */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COLUMN 1: Clinical Timeline & tabs for Patient Summary (Col span 8) */}
        <div className="lg:col-span-8 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
          
          {/* Horizontal Clinical Timeline strip */}
          <div className="flex flex-col gap-2 font-mono text-[9px] border-b border-blue-950/40 pb-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">EHR WORKFLOW TIMELINE</span>
            <div className="flex items-center justify-between w-full relative">
              
              {/* Central connecting line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-950/50 -translate-y-1/2 z-0" />
              
              {activePatient.clinicalTimeline ? activePatient.clinicalTimeline.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center relative z-10 gap-1.5 select-none">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                    item.completed 
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-400' 
                      : 'bg-black border-slate-800 text-slate-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.completed ? 'bg-cyan-400 animate-pulse' : 'bg-transparent'}`} />
                  </div>
                  <span className={`font-bold uppercase text-[8px] ${item.completed ? 'text-slate-200' : 'text-slate-600'}`}>{item.step}</span>
                  <span className="text-[7px] text-slate-500 -mt-0.5">{item.time}</span>
                </div>
              )) : (
                <span className="text-slate-500">No active timeline mapped for record.</span>
              )}

            </div>
          </div>

          {/* Panel tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex border-b border-blue-950/30 gap-4 text-[10px] font-mono font-bold">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`pb-1.5 cursor-pointer uppercase ${activeTab === 'summary' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Patient Summary
              </button>
              <button 
                onClick={() => setActiveTab('meds')}
                className={`pb-1.5 cursor-pointer uppercase ${activeTab === 'meds' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Medications
              </button>
              <button 
                onClick={() => setActiveTab('labs')}
                className={`pb-1.5 cursor-pointer uppercase ${activeTab === 'labs' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Investigations
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`pb-1.5 cursor-pointer uppercase ${activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Clinical History
              </button>
            </div>

            {/* Tabs content rendering */}
            <div className="min-h-[140px] text-xs">
              
              {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">Chief Complaint</span>
                      <p className="text-slate-200 leading-relaxed font-semibold">
                        {activePatient.symptoms.replace(/\[[^\]]+\]/g, '').trim() || 'No active symptoms recorded.'}
                      </p>
                    </div>
                    {activePatient.notes && (
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">History of Present Illness (HPI)</span>
                        <p className="text-slate-400 leading-relaxed">
                          {activePatient.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-0.5">Clinical Profile Markers</span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                      <div className="bg-black/30 border border-blue-950/40 p-2 rounded">
                        <span className="text-slate-500 block text-[8px] uppercase">Blood Type</span>
                        <span className="text-white font-bold text-xs">{activePatient.bloodType || 'O+'}</span>
                      </div>
                      <div className="bg-black/30 border border-blue-950/40 p-2 rounded">
                        <span className="text-slate-500 block text-[8px] uppercase">ESI Severity Level</span>
                        <span className="text-rose-400 font-bold text-xs">Level {activePatient.esiLevel || 3}</span>
                      </div>
                      <div className="bg-black/30 border border-blue-950/40 p-2 rounded">
                        <span className="text-slate-500 block text-[8px] uppercase">Random Blood Sugar</span>
                        <span className="text-cyan-400 font-bold text-xs">{activePatient.bloodSugar || 'N/A'} mg/dL</span>
                      </div>
                      <div className="bg-black/30 border border-blue-950/40 p-2 rounded">
                        <span className="text-slate-500 block text-[8px] uppercase">Pain Index scale</span>
                        <span className="text-white font-bold text-xs">{activePatient.painScale || 5}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'meds' && (
                <div className="font-mono text-xs space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Prescribed Active Medications</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-black/40 border border-blue-950/30 rounded flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-100">Paracetamol 650mg</div>
                        <div className="text-[9px] text-slate-500">Analgesic & Antipyretic SOS</div>
                      </div>
                      <span className="bg-rose-950/40 border border-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded text-[10px]">SOS</span>
                    </div>
                    {activePatient.id === 'pat-1' ? (
                      <div className="p-2.5 bg-black/40 border border-blue-950/30 rounded flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-100">Ibuprofen 400mg</div>
                          <div className="text-[9px] text-slate-500">Anti-inflammatory BD (Post Meal)</div>
                        </div>
                        <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded text-[10px]">BD</span>
                      </div>
                    ) : activePatient.id === 'pat-3' ? (
                      <div className="p-2.5 bg-black/40 border border-blue-950/30 rounded flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-100">AKT-4 Regimen Kit</div>
                          <div className="text-[9px] text-slate-500">Anti-Tubercular DOTS dosage OD</div>
                        </div>
                        <span className="bg-green-950/40 border border-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded text-[10px]">OD</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-black/40 border border-blue-950/30 rounded flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-100">ORS Hydration Salts</div>
                          <div className="text-[9px] text-slate-500">Fluid replenishment in water SOS</div>
                        </div>
                        <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded text-[10px]">SOS</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'labs' && (
                <div className="font-mono text-xs space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Investigations & Diagnostics Results</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-black/50 border border-blue-950/20">
                      <div className="flex gap-4">
                        <span className="text-gray-500">04 July 2025</span>
                        <span className="text-slate-100 font-bold">Random Blood Sugar Assay</span>
                      </div>
                      <span className="text-cyan-400 font-bold">{activePatient.bloodSugar || '108'} mg/dL</span>
                    </div>
                    {activePatient.id === 'pat-1' && (
                      <div className="flex justify-between items-center p-2 rounded bg-black/50 border border-blue-950/20">
                        <div className="flex gap-4">
                          <span className="text-gray-500">04 July 2025</span>
                          <span className="text-slate-100 font-bold">X-Ray Forearm AP/LAT</span>
                        </div>
                        <span className="text-rose-400 font-bold">Radial Fracture Highlighted</span>
                      </div>
                    )}
                    {activePatient.id === 'pat-2' && (
                      <div className="flex justify-between items-center p-2 rounded bg-black/50 border border-blue-950/20">
                        <div className="flex gap-4">
                          <span className="text-gray-500">04 July 2025</span>
                          <span className="text-slate-100 font-bold">Complete Blood Count (CBC)</span>
                        </div>
                        <span className="text-rose-400 font-bold">Platelets: 92,000/uL (Thrombocytopenia)</span>
                      </div>
                    )}
                    {activePatient.id === 'pat-3' && (
                      <div className="flex justify-between items-center p-2 rounded bg-black/50 border border-blue-950/20">
                        <div className="flex gap-4">
                          <span className="text-gray-500">04 July 2025</span>
                          <span className="text-slate-100 font-bold">Sputum smear AFB staining</span>
                        </div>
                        <span className="text-rose-400 font-bold">AFB Smear Positive (3+)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="font-mono text-xs space-y-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Comorbidities & Surgical History</div>
                  {activePatient.selectedHistory && activePatient.selectedHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activePatient.selectedHistory.map((h, i) => (
                        <div key={i} className="px-3 py-1.5 rounded bg-[#091026]/40 border border-blue-950/40 text-slate-300 font-bold">
                          {h}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 p-2 text-center border border-dashed border-blue-950/20 rounded">
                      No chronic comorbidities registered in ABDM central records.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* COLUMN 2: Doctor Actions (Col span 4) */}
        <div className="lg:col-span-4 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex flex-col gap-4 shadow-xl font-mono text-xs">
          
          <div className="border-b border-blue-950/40 pb-2 mb-1">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4" /> Doctor Actions panel
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setApprovalStatus('Approved')}
              className={`py-2.5 rounded font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                approvalStatus === 'Approved' 
                  ? 'bg-green-950 border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]' 
                  : 'bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border-[#22c55e]/20 text-[#22c55e]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Approve</span>
            </button>

            <button 
              onClick={() => {
                setApprovalStatus('Modified')
                setIsModalOpen(true) // Trigger scanner to modify findings
              }}
              className={`py-2.5 rounded font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                approvalStatus === 'Modified' 
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                  : 'bg-cyan-555/10 hover:bg-cyan-900/20 border-cyan-500/20 text-cyan-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Modify</span>
            </button>

            <button 
              onClick={() => setApprovalStatus('Rejected')}
              className={`py-2.5 rounded font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                approvalStatus === 'Rejected' 
                  ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse' 
                  : 'bg-red-950/20 hover:bg-red-900/20 border-red-500/20 text-red-400'
              }`}
            >
              <X className="w-4 h-4" />
              <span className="text-[9px] mt-0.5">Reject</span>
            </button>
          </div>

          {/* Secondary helper Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 text-[10px]">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 transition text-cyan-400 font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" /> New AI Scan
            </button>

            <button 
              onClick={() => alert("Speech dictation activated. Please speak symptoms narrative...")}
              className="py-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 transition text-slate-300 font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-slate-500" /> Voice Dictation
            </button>

            <button 
              onClick={() => alert("Central Clinical Report PDF generated and queued for printing.")}
              className="py-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 transition text-slate-300 font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Generate Report
            </button>

            <button 
              onClick={() => alert("Clinical profile syncing with ABDM Central EMR database...")}
              className="py-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 transition text-slate-300 font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> Send to EMR
            </button>
          </div>

          <div className="flex-1 flex items-end">
            <div className="w-full text-center py-2.5 rounded-lg bg-cyan-950/10 border border-cyan-500/10 text-[9px] text-cyan-500/80 tracking-widest uppercase font-black">
              🔒 SSL ENCRYPTED EMR CONNECTIVITY
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED DIALOG MODAL FOR THE AI SYMPTOM SCANNER INTAKE FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#070f2b] border border-blue-900/60 rounded-2xl w-full max-w-[500px] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-black/60 px-5 py-4 border-b border-blue-950/60 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-cyan-400 font-mono tracking-wide uppercase">AI Clinical Intake Scanner</h3>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">Submit patient parameters to isolate body region anomalies.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Scrollable Intake form */}
            <div className="flex-1 overflow-y-auto max-h-[75vh] custom-scrollbar">
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
  )
}