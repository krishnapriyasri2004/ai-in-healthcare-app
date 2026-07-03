'use client'

import { useState } from 'react'
import { BodyModel } from './body-model'
import { SymptomInput } from './symptom-input'
import { AnalysisResults } from './analysis-results'
import { MedicalHistory } from './medical-history'
import { 
  Activity, History, Search, Layers, Users, Plus, Heart, 
  TrendingUp, FileText, CheckCircle, ArrowRight, Settings 
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
  }>
  recommendations: string[]
  severityScore: number
}

interface Patient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  symptoms: string
  notes: string
  vitals: { temp: string; hr: string; spo2: string; bp: string }
  analysis: Analysis | null
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Elena Rostova',
    age: 28,
    gender: 'Female',
    symptoms: 'Patient reports persistent headache for 72h, body temperature 38°C, and neck stiffness.',
    notes: 'Prior history of migraines. Blood pressure normal.',
    vitals: { temp: '38.0', hr: '88', spo2: '97', bp: '120/80' },
    analysis: {
      predictedCondition: 'Viral Meningitis (Suspected)',
      confidence: 'medium',
      reasoning: 'Symptoms of cephalalgia combined with fever and neck stiffness strongly indicate meningeal inflammation.',
      affectedRegions: [
        { bodyRegion: 'brain', confidence: 'medium', condition: 'Meningeal inflammation', reasoning: 'Severe cephalalgia and neck stiffness.' },
        { bodyRegion: 'throat', confidence: 'low', condition: 'Pharyngeal irritation', reasoning: 'Mild throat discomfort reported.' }
      ],
      recommendations: ['Immediate lumbar puncture recommended', 'Administer IV fluids', 'Isolate in quiet, dark room'],
      severityScore: 65
    }
  },
  {
    id: 'pat-2',
    name: 'John Doe',
    age: 52,
    gender: 'Male',
    symptoms: 'Sharp chest pain radiating to left arm, shortness of breath, and mild sweating.',
    notes: 'History of chronic hypertension. High cholesterol.',
    vitals: { temp: '36.8', hr: '104', spo2: '94', bp: '150/95' },
    analysis: {
      predictedCondition: 'Acute Coronary Syndrome',
      confidence: 'high',
      reasoning: 'Left-sided radiating chest pain combined with tachycardia and hypertension is a classic indicator of myocardial ischemia.',
      affectedRegions: [
        { bodyRegion: 'heart', confidence: 'high', condition: 'Myocardial Ischemia', reasoning: 'Sharp radiating chest pain.' },
        { bodyRegion: 'lungs', confidence: 'medium', condition: 'Dyspnea', reasoning: 'Shortness of breath from cardiac strain.' }
      ],
      recommendations: ['Perform immediate 12-lead ECG', 'Administer Aspirin 325mg orally', 'Establish IV access and give oxygen'],
      severityScore: 90
    }
  },
  {
    id: 'pat-3',
    name: 'Sarah Jenkins',
    age: 41,
    gender: 'Female',
    symptoms: 'Persistent dry cough, congestion, runny nose, and fatigue.',
    notes: 'No chronic history. Symptoms started 4 days ago.',
    vitals: { temp: '37.1', hr: '74', spo2: '99', bp: '115/75' },
    analysis: {
      predictedCondition: 'Upper Respiratory Infection',
      confidence: 'high',
      reasoning: 'Typical presentation of viral rhinopharyngitis with cough, congestion, and mild temperature elevation.',
      affectedRegions: [
        { bodyRegion: 'nasal_cavity', confidence: 'high', condition: 'Rhinitis', reasoning: 'Congestion and nasal discharge.' },
        { bodyRegion: 'throat', confidence: 'high', condition: 'Pharyngitis', reasoning: 'Sore throat and dry cough.' }
      ],
      recommendations: ['Stay hydrated and rest', 'Use saline nasal spray', 'Symptomatic relief with acetaminophen'],
      severityScore: 25
    }
  }
]

type PortalTab = 'patients' | 'diagnostic' | 'analytics' | 'settings'
type PanelMode = 'input' | 'results' | 'history'

export function Dashboard() {
  // Navigation & Patients State
  const [activeTab, setActiveTab] = useState<PortalTab>('patients')
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  
  // Active Telemetry Panels State
  const [panelMode, setPanelMode] = useState<PanelMode>('results')
  const [isLoading, setIsLoading] = useState(false)

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

  // Selected Patient computed details
  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0]
  }, [patients, selectedPatientId])

  const toggleSystem = (key: keyof typeof systems) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Handle Symptom analysis
  const handleAnalyzeSymptoms = async (
    symptoms: string, 
    notes: string, 
    gender: string,
    vitalsData?: { temp: string; hr: string; spo2: string; bp: string }
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, notes, gender, vitals: vitalsData }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      
      // Update patient profile in directory
      setPatients(prev => prev.map(p => {
        if (p.id === selectedPatientId) {
          return {
            ...p,
            symptoms,
            notes,
            vitals: vitalsData || p.vitals,
            analysis: data.analysis
          }
        }
        return p
      }))
      
      setPanelMode('results')
    } catch (error) {
      console.error('Error analyzing symptoms:', error)
      alert('Failed to analyze symptoms. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Add Patient Modal/Prompt Action
  const handleAddPatient = () => {
    const name = prompt("Enter patient name:")
    if (!name) return
    const ageStr = prompt("Enter patient age:")
    const age = parseInt(ageStr || '30')
    const gender = confirm("Select biological sex: OK for Female, Cancel for Male") ? 'Female' : 'Male'
    
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name,
      age,
      gender,
      symptoms: '',
      notes: '',
      vitals: { temp: '36.6', hr: '72', spo2: '98', bp: '120/80' },
      analysis: null
    }

    setPatients(prev => [...prev, newPatient])
    setSelectedPatientId(newPatient.id)
    setPanelMode('input')
    setActiveTab('diagnostic')
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* top navbar */}
      <header className="absolute top-0 w-full z-50 bg-[#070f2b]/80 backdrop-blur-md border-b border-blue-950/65 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-white uppercase">METROPOLIS HEALTH SYSTEM</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-500 font-mono">
              Clinical Command Portal & Telemetry Hub
            </p>
          </div>
        </div>

        {/* Diagnostic Stat telemetries */}
        <div className="hidden lg:flex gap-6 items-center text-xs font-mono">
          <div className="border-l border-blue-900/30 pl-4">
             <div className="text-[10px] text-gray-500 uppercase">Hospital Occupancy</div>
             <div className="text-cyan-400 font-bold">84% <span className="text-[10px] text-gray-400 font-normal">(146 Wards)</span></div>
          </div>
          <div className="border-l border-blue-900/30 pl-4">
             <div className="text-[10px] text-gray-500 uppercase">Critical Warnings</div>
             <div className="text-red-500 font-bold flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
               3 Alerts
             </div>
          </div>
          <div className="border-l border-blue-900/30 pl-4">
             <div className="text-[10px] text-gray-500 uppercase">Scanner Arrays</div>
             <div className="text-green-500 font-bold">Connected</div>
          </div>
        </div>
      </header>

      {/* Main clinical portal structure */}
      <main className="flex-1 relative flex pt-16">
        
        {/* Futuristic left navigational console bar */}
        <div className="w-16 bg-[#070f2b]/40 backdrop-blur-xl border-r border-blue-950/50 flex flex-col items-center py-6 gap-6 z-20">
          <button 
            onClick={() => setActiveTab('patients')}
            className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'patients' ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
            title="Patient Directory"
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('diagnostic')}
            className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'diagnostic' ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
            title="3D Diagnostic Viewer"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'analytics' ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
            title="Clinical History"
          >
            <FileText className="w-5 h-5" />
          </button>
          <div className="mt-auto">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-3 rounded-xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              title="Scanner Config"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D viewport canvas background layer */}
        <div className="absolute inset-0 pl-16 z-0 bg-[#020617]">
          <BodyModel 
            affectedRegions={activePatient?.analysis?.affectedRegions || []} 
            opacity={opacity} 
            wireframe={wireframe}
            activeSystems={systems}
            vitals={activePatient?.vitals || undefined}
          />
        </div>

        {/* Left Floating patient list (only visible in Patients mode) */}
        {activeTab === 'patients' && (
          <div className="absolute left-20 top-20 w-80 pointer-events-none z-10 flex flex-col gap-4">
            <div className="bg-black/80 backdrop-blur-xl border border-blue-900/40 p-4 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-blue-900/30 pb-2 mb-1">
                 <span className="font-bold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                   <Users className="w-4 h-4 text-cyan-400" /> Patient Registry
                 </span>
                 <button 
                   onClick={handleAddPatient}
                   className="p-1 rounded bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/30 transition text-cyan-400 flex items-center justify-center"
                   title="Add patient profile"
                 >
                   <Plus className="w-3.5 h-3.5" />
                 </button>
              </div>

              {/* Patient Cards */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                 {patients.map(p => (
                   <div 
                     key={p.id}
                     onClick={() => setSelectedPatientId(p.id)}
                     className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col gap-1.5 ${
                       selectedPatientId === p.id 
                         ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                         : 'bg-black/40 border-blue-950/40 hover:bg-white/5'
                     }`}
                   >
                     <div className="flex justify-between items-start">
                       <div>
                         <h4 className="font-bold text-xs text-white">{p.name}</h4>
                         <span className="text-[10px] text-gray-400 uppercase font-mono">{p.gender}, Age {p.age}</span>
                       </div>
                       {p.analysis ? (
                         <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded ${
                           p.analysis.confidence === 'high' 
                             ? 'bg-red-950/50 text-red-400 border border-red-500/20' 
                             : 'bg-orange-950/50 text-orange-400 border border-orange-500/20'
                         }`}>
                           {p.analysis.predictedCondition.split(' ')[0]}
                         </span>
                       ) : (
                         <span className="text-[8px] font-mono text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded">NO SCAN</span>
                       )}
                     </div>

                     <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 pt-1.5 border-t border-white/5">
                        <span>HR: <span className="text-cyan-400 font-bold">{p.vitals.hr}</span></span>
                        <span>BP: <span className="text-cyan-400 font-bold">{p.vitals.bp}</span></span>
                        <span>SpO2: <span className="text-cyan-400 font-bold">{p.vitals.spo2}%</span></span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating active system visual controls sidebar (Anatomy Explorer) */}
        <div className="absolute left-20 bottom-24 w-64 pointer-events-none z-10 flex flex-col gap-4">
           <div className="bg-black/75 backdrop-blur-md border border-blue-950/60 rounded-xl overflow-hidden shadow-2xl pointer-events-auto">
              <div className="bg-black/60 px-4 py-2 border-b border-blue-950/60 flex items-center justify-between">
                 <span className="font-bold text-xs tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                   <Layers className="w-3.5 h-3.5" /> Anatomy Explorer
                 </span>
              </div>
              
              <div className="p-4 flex flex-col gap-3 font-mono text-[11px] text-gray-300">
                 {/* System toggles */}
                 {Object.entries(systems).map(([system, isActive]) => (
                   <div key={system} className="flex items-center justify-between">
                      <span className="capitalize">{system}</span>
                      <button 
                        onClick={() => toggleSystem(system as keyof typeof systems)}
                        className={`w-9 h-4.5 rounded-full relative transition-colors ${isActive ? 'bg-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'bg-gray-800'}`}
                      >
                         <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${isActive ? 'left-5' : 'left-0.5'}`} />
                      </button>
                   </div>
                 ))}

                 <div className="h-px w-full bg-blue-950/30 my-1" />

                 {/* Render wireframe modes */}
                 <div className="flex items-center justify-between">
                    <span>Wireframe Shell</span>
                    <button 
                      onClick={() => setWireframe(!wireframe)}
                      className={`w-9 h-4.5 rounded-full relative transition-colors ${wireframe ? 'bg-cyan-600' : 'bg-gray-800'}`}
                    >
                       <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${wireframe ? 'left-5' : 'left-0.5'}`} />
                    </button>
                 </div>

                 {/* Opacity slider */}
                 <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between text-[10px] text-cyan-400">
                       <span>Skin Opacity</span>
                       <span>{Math.round(opacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.05" max="0.95" step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Center Bottom active status pill */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
           <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 px-6 py-2.5 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-mono">
                 3D {activePatient?.gender} TELEMETRY LAYERS ACTIVE
              </span>
           </div>
        </div>

        {/* Right Sidebar panel containing diagnostic controls */}
        <div className="absolute right-6 top-20 w-[420px] pointer-events-none z-10 flex flex-col gap-4">
          
          {/* Active Patient Card Profile */}
          {activePatient && (
            <div className="bg-[#070f2b]/80 backdrop-blur-xl border border-cyan-500/20 p-4 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col gap-2 font-mono text-xs">
              <div className="text-[10px] text-cyan-500 tracking-wider font-bold">SELECTED CLINICAL PROFILE</div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-white font-bold text-sm">{activePatient.name}</span>
                <span className="text-gray-400">Age: {activePatient.age} | Sex: {activePatient.gender}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-900/30 text-[11px] text-gray-300">
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>HR: <strong className="text-white">{activePatient.vitals.hr} BPM</strong></span>
                </div>
                <div>Temp: <strong className="text-white">{activePatient.vitals.temp}°C</strong></div>
                <div>BP: <strong className="text-white">{activePatient.vitals.bp}</strong></div>
                <div>SpO2: <strong className="text-white">{activePatient.vitals.spo2}%</strong></div>
              </div>
            </div>
          )}

          {/* Core Telemetry Input / Output panel */}
          <div className="bg-black/75 backdrop-blur-xl border border-blue-950/60 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.7)] pointer-events-auto flex flex-col max-h-[68vh] z-20">
            <div className="bg-black/60 px-4 py-3 border-b border-blue-950/60 flex items-center justify-between">
              {/* Tab options on panel */}
              <div className="flex gap-4 text-xs font-mono">
                <button 
                  onClick={() => setPanelMode('input')}
                  className={`pb-1 font-bold ${panelMode === 'input' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  [TELEMETRY INPUT]
                </button>
                <button 
                  onClick={() => setPanelMode('results')}
                  disabled={!activePatient?.analysis}
                  className={`pb-1 font-bold disabled:opacity-50 ${panelMode === 'results' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  [DIAGNOSTICS]
                </button>
                <button 
                  onClick={() => setPanelMode('history')}
                  className={`pb-1 font-bold ${panelMode === 'history' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  [CLINICAL RECORDS]
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {panelMode === 'input' && (
                <SymptomInput onAnalyze={handleAnalyzeSymptoms} isLoading={isLoading} />
              )}

              {panelMode === 'results' && activePatient?.analysis && (
                <div className="p-6">
                  {/* System Threat Level */}
                  <div className="bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-lg mb-6 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[10px] text-cyan-500 font-bold block mb-1">SYSTEM THREAT LEVEL</span>
                      <div className="w-32 h-2 rounded-full bg-cyan-950 border border-cyan-500/20 overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                          style={{ width: `${activePatient.analysis.severityScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-black text-cyan-400">{activePatient.analysis.severityScore}%</span>
                  </div>

                  <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-500 mb-4">
                     Identified Pathologies
                  </h2>
                  <AnalysisResults analysis={activePatient.analysis} />
                </div>
              )}

              {panelMode === 'history' && (
                <div className="p-6">
                  <MedicalHistory />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Global custom scrollbar style overlay */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.15); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.35); }
      `}} />
    </div>
  )
}
