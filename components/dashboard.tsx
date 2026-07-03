'use client'

import { useState, useMemo } from 'react'
import { BodyModel } from './body-model'
import { SymptomInput } from './symptom-input'
import { AnalysisResults } from './analysis-results'
import { Heart, Activity, SlidersHorizontal, Info } from 'lucide-react'

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

const SHIELD_PATIENTS: Patient[] = [
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
  }
]

export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>(SHIELD_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  
  const [panelMode, setPanelMode] = useState<'input' | 'results'>('results')
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
    let analysisData = null
    const basePath = window.location.hostname === 'localhost' ? '' : '/ai-in-healthcare'

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
      console.log('API call failed (expected on static hosting). Running client-side simulation.', error)
      
      // Client-side rule-based mock engine
      const text = symptoms.toLowerCase()
      if (text.includes('chest') || text.includes('heart') || text.includes('cardiac')) {
        analysisData = {
          predictedCondition: 'Acute Coronary Syndrome',
          confidence: 'high' as const,
          reasoning: 'Symptoms of chest pressure or discomfort combined with vitals telemetry indicate potential coronary artery insufficiency.',
          affectedRegions: [
            { bodyRegion: 'heart', confidence: 'high' as const, condition: 'Myocardial Ischemia', reasoning: 'Reported chest pain and pressure.' },
            { bodyRegion: 'lungs', confidence: 'medium' as const, condition: 'Dyspnea', reasoning: 'Associated shortness of breath.' }
          ],
          recommendations: ['Seek emergency cardiology consult', 'Obtain immediate 12-lead ECG', 'Administer emergency oxygen if indicated'],
          severityScore: 92
        }
      } else if (text.includes('cough') || text.includes('lung') || text.includes('breath') || text.includes('respiratory')) {
        analysisData = {
          predictedCondition: 'Acute Bronchitis',
          confidence: 'high' as const,
          reasoning: 'Persistent cough, dyspnea, and respiratory telemetry point to bronchial mucosal inflammation.',
          affectedRegions: [
            { bodyRegion: 'lungs', confidence: 'high' as const, condition: 'Bronchial irritation', reasoning: 'Frequent dry or productive cough.' },
            { bodyRegion: 'trachea', confidence: 'medium' as const, condition: 'Tracheitis', reasoning: 'Upper airway irritation during coughing fits.' }
          ],
          recommendations: ['Use humidified air', 'Stay hydrated to thin secretions', 'Avoid smoking and second-hand smoke'],
          severityScore: 40
        }
      } else if (text.includes('head') || text.includes('brain') || text.includes('migraine')) {
        analysisData = {
          predictedCondition: 'Severe Migraine Headache',
          confidence: 'medium' as const,
          reasoning: 'Acutely elevated headache scores and sensory sensitivity points to neurovascular cephalalgia.',
          affectedRegions: [
            { bodyRegion: 'brain', confidence: 'high' as const, condition: 'Neurovascular spasm', reasoning: 'Severe throbbing cephalalgia.' }
          ],
          recommendations: ['Rest in a darkened, quiet room', 'Apply cool compress to forehead', 'Consider physician consultation for triptans'],
          severityScore: 50
        }
      } else {
        // Default fallback (Flu/Influenza)
        analysisData = {
          predictedCondition: 'Acute Viral Pharyngitis',
          confidence: 'medium' as const,
          reasoning: 'General symptoms of rhinitis, fatigue, and throat soreness match standard viral presentation.',
          affectedRegions: [
            { bodyRegion: 'nasal_cavity', confidence: 'high' as const, condition: 'Rhinitis', reasoning: 'Nasal congestion and sneezing.' },
            { bodyRegion: 'throat', confidence: 'high' as const, condition: 'Pharyngitis', reasoning: 'Pharyngeal erythema and soreness.' }
          ],
          recommendations: ['Stay hydrated with warm fluids', 'Get adequate rest', 'Use saline nasal rinses'],
          severityScore: 30
        }
      }
    }

    // Update patient profile in directory
    if (analysisData) {
      setPatients(prev => prev.map(p => {
        if (p.id === selectedPatientId) {
          return {
            ...p,
            symptoms,
            notes,
            vitals: vitalsData || p.vitals,
            analysis: analysisData
          }
        }
        return p
      }))
      setPanelMode('results')
    }
    setIsLoading(false)
  }

  return (
    <div className="w-full h-full relative flex">
      {/* Background 3D Model Layer */}
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <BodyModel 
          affectedRegions={activePatient?.analysis?.affectedRegions || []} 
          opacity={opacity} 
          wireframe={wireframe}
          activeSystems={systems}
          vitals={activePatient?.vitals || undefined}
        />
      </div>

      {/* Floating active system visual controls sidebar (Anatomy Explorer) */}
      <div className="absolute left-6 bottom-6 w-64 pointer-events-none z-10 flex flex-col gap-4">
         <div className="bg-black/75 backdrop-blur-md border border-blue-950/60 rounded-xl overflow-hidden shadow-2xl pointer-events-auto">
            <div className="bg-black/60 px-4 py-2 border-b border-blue-950/60 flex items-center justify-between">
               <span className="font-bold text-xs tracking-wider uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
                 ⚙️ Anatomy Explorer
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

      {/* Floating active status pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
         <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 px-6 py-2.5 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase font-mono">
               3D HOLOGRAPHIC RENDERING ACTIVE
            </span>
         </div>
      </div>

      {/* Right Sidebar panel containing diagnostic controls */}
      <div className="absolute right-6 top-4 w-[420px] pointer-events-none z-10 flex flex-col gap-4">
        
        {/* Active Patient Card Profile Selector */}
        {activePatient && (
          <div className="bg-[#070f2b]/85 backdrop-blur-xl border border-cyan-500/20 p-4 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between items-center text-[10px] text-cyan-500 tracking-wider font-bold">
              <span>SCAN TARGET CLINICAL PROFILE</span>
              <select 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-black border border-cyan-500/30 text-cyan-400 text-[10px] rounded px-1.5 py-0.5 outline-none font-bold"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between items-center mt-1">
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
        <div className="bg-black/75 backdrop-blur-xl border border-blue-950/60 rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.7)] pointer-events-auto flex flex-col max-h-[58vh] z-20">
          <div className="bg-black/60 px-4 py-3 border-b border-blue-950/60 flex items-center justify-between">
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
          </div>
        </div>
      </div>
    </div>
  )
}
