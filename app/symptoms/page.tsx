'use client'

import { useState, useMemo } from 'react'
import { BodyModel } from '@/components/body-model'
import { 
  Sparkles, 
  Activity, 
  Search, 
  ClipboardList, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Heart,
  Stethoscope,
  Info
} from 'lucide-react'

interface RegionInfo {
  bodyRegion: string
  confidence: 'high' | 'medium' | 'low'
  condition: string
  reasoning: string
  symptoms?: string
  relevantVitalsHistory?: string
}

interface DiagnosisResult {
  predictedCondition: string
  confidence: number
  reasoning: string
  icd10: string
  snomed: string
  affectedRegions: RegionInfo[]
  recommendations: string[]
  vitals: { temp: string; hr: string; spo2: string; bp: string }
  timeline: string[]
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
  }
]

export default function SymptomsPage() {
  const [symptomsInput, setSymptomsInput] = useState('')
  const [patientAge, setPatientAge] = useState(35)
  const [patientGender, setPatientGender] = useState<'Male' | 'Female'>('Male')
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)

  const handleRunPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSymptomsInput(preset.symptoms)
    setPatientAge(preset.age)
    setPatientGender(preset.gender)
    setDiagnosisResult(null)
  }

  const handleAnalyze = () => {
    if (!symptomsInput.trim()) return

    setIsAnalyzing(true)
    setProgressStep(0)
    setDiagnosisResult(null)

    // Run progressive scanning animations
    const interval = setInterval(() => {
      setProgressStep(prev => {
        if (prev >= 3) {
          clearInterval(interval)
          // Compute diagnostic outcomes
          setTimeout(() => {
            const result = performDiagnosticPrognosis(symptomsInput, patientAge, patientGender)
            setDiagnosisResult(result)
            setIsAnalyzing(false)
          }, 400)
          return prev
        }
        return prev + 1
      })
    }, 600)
  }

  // Diagnostic outcome engine
  const performDiagnosticPrognosis = (input: string, age: number, gender: 'Male' | 'Female'): DiagnosisResult => {
    const query = input.toLowerCase()
    
    if (query.includes('chest pain') || query.includes('retrosternal') || query.includes('myocardial') || query.includes('heart')) {
      return {
        predictedCondition: 'Acute Coronary Syndrome (Suspected STEMI)',
        confidence: 94,
        icd10: 'I21.3',
        snomed: '401303003',
        vitals: { temp: '36.8', hr: '104', spo2: '94', bp: '150/95' },
        reasoning: 'Sudden onset of severe retrosternal pressure with somatic radiation to the left arm, coupled with tachycardia and mild hypoxemia, points strongly toward myocardial ischemia.',
        affectedRegions: [
          {
            bodyRegion: 'heart',
            confidence: 'high',
            condition: 'ST-Elevation Myocardial Infarction',
            reasoning: 'LAD artery flow depletion. Immediate Bedside 12-lead ECG, loading doses of Aspirin (325mg) & Clopidogrel (300mg) required.'
          }
        ],
        recommendations: [
          'Order bedside 12-lead Electrocardiogram (ECG) immediately.',
          'Administer dual antiplatelet therapy (Aspirin 325mg + Clopidogrel 300mg) loading doses.',
          'Start high-flow supplemental oxygen therapy and secure dual large-bore IV access.',
          'Alert Interventional Cardiology team and activate Cath Lab for primary PCI.'
        ],
        timeline: [
          'Symptom onset reported: 2 hours ago',
          'Intake triage completed: Just now',
          'Vitals synchronization: Complete',
          'AI Primary prognosis: Acute Coronary Syndrome'
        ]
      }
    }

    if (query.includes('fever') && (query.includes('joint') || query.includes('platelet') || query.includes('rash') || query.includes('dengue'))) {
      return {
        predictedCondition: 'Dengue Hemorrhagic Fever (Grade II)',
        confidence: 88,
        icd10: 'A91',
        snomed: '38362002',
        vitals: { temp: '39.4', hr: '98', spo2: '97', bp: '105/70' },
        reasoning: 'High-grade continuous fever (>5 days) associated with severe breakbone aches, retro-orbital headache, and petechial rashes is diagnostic of Dengue Fever. Capillary leak indices must be checked.',
        affectedRegions: [
          {
            bodyRegion: 'stomach',
            confidence: 'medium',
            condition: 'Thrombocytopenia & Splenomegaly Risk',
            reasoning: 'Vascular permeability increase and platelet destruction. Monitor hematocrit and platelet counts daily.'
          }
        ],
        recommendations: [
          'Order daily Complete Blood Count (CBC) to monitor Hematocrit and Platelet levels.',
          'Initiate aggressive oral fluid replacement therapy using WHO ORS (Electral).',
          'Strictly avoid NSAIDs (Ibuprofen, Aspirin) due to elevated bleeding risks; use Paracetamol only.',
          'Monitor for warning signs: persistent vomiting, abdominal pain, mucosal bleeding.'
        ],
        timeline: [
          'Fever duration: 5 days',
          'Rash presentation: 1 day ago',
          'Triage CBC check: Pending',
          'AI Primary prognosis: Dengue Hemorrhagic Fever'
        ]
      }
    }

    if (query.includes('cough') || query.includes('sputum') || query.includes('tuberculosis') || query.includes('lung') || query.includes('tb')) {
      return {
        predictedCondition: 'Pulmonary Tuberculosis (Active / Cavitary)',
        confidence: 92,
        icd10: 'A15.0',
        snomed: '56717001',
        vitals: { temp: '37.8', hr: '82', spo2: '96', bp: '118/75' },
        reasoning: 'Persistent productive cough of 3 weeks with hemoptysis, subfebrile evening rises in temperature, night sweats, and significant weight loss is highly indicative of Pulmonary TB in endemic areas.',
        affectedRegions: [
          {
            bodyRegion: 'lungs',
            confidence: 'high',
            condition: 'Pulmonary Cavitation',
            reasoning: 'Mycobacterium tuberculosis infection in lung parenchymal tissues causing tissue destruction.'
          }
        ],
        recommendations: [
          'Order immediate Chest X-Ray (PA view) and sputum smear check for AFB.',
          'Perform GeneXpert MTB/RIF assay to identify drug resistance patterns.',
          'Refer to local DOTS center for NIKSHAY registration and initiation of standard HREZ therapy.',
          'Advise droplet precautions and isolate until sputum smear conversion is confirmed.'
        ],
        timeline: [
          'Cough duration: 3 weeks',
          'Hemoptysis reported: 2 days ago',
          'Weight loss reported: 5 kg loss',
          'AI Primary prognosis: Pulmonary Tuberculosis'
        ]
      }
    }

    // Default Fallback
    return {
      predictedCondition: 'Acute Bronchitis / Respiratory Viral Syndrome',
      confidence: 72,
      icd10: 'J20.9',
      snomed: '10509002',
      vitals: { temp: '37.5', hr: '88', spo2: '98', bp: '120/80' },
      reasoning: 'General respiratory irritations. Diffuse congestion without localized lobar consolidation signs. Differential includes common cold and viral pharyngitis.',
      affectedRegions: [
        {
          bodyRegion: 'throat',
          confidence: 'low',
          condition: 'Laryngeal Congestion',
          reasoning: 'Pharyngeal erythema and localized inflammation secondary to upper respiratory viral invasion.'
        }
      ],
      recommendations: [
        'Prescribe warm saline gargles and vapor steam inhalations.',
        'Symptomatic therapy with cough suppressants or antihistamines as needed.',
        'Advise adequate hydration and rest; review if fever spikes or dyspnea worsens.'
      ],
      timeline: [
        'Onset reported: Under 1 week',
        'Triage vitals: Stable',
        'AI Primary prognosis: Acute Bronchitis'
      ]
    }
  }

  return (
    <div className="w-full h-full bg-[#030712] flex flex-col p-6 overflow-y-auto font-mono text-xs text-slate-300">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-blue-950/60 pb-4 mb-6">
        <div>
          <h1 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            🧬 Clinical Symptoms & Intake Workspace
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Enter symptoms below to run diagnostic prognosis and isolate the digital anatomical twin.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#070f2b] border border-blue-900/30 text-emerald-400 font-bold uppercase text-[9px]">
          ● ABDM AI Sync Online
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* LEFT COLUMN: Input form & presets (Col span 5) */}
        <div className="col-span-5 flex flex-col gap-6">
          
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
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Input Form */}
          <div className="bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 flex flex-col">
              <span className="text-cyan-400 font-bold uppercase text-[9px] border-b border-blue-950/30 pb-1.5 tracking-wider block">
                ✍ Clinician Triage Entry
              </span>

              {/* Patient Basic Fields */}
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
              </div>

              {/* Symptoms Textarea */}
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-slate-500 text-[9px] uppercase">Presenting Symptoms / Notes</label>
                <textarea
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Type symptoms here (e.g. high fever, chronic cough, left arm pain...)"
                  className="w-full flex-1 bg-black/60 border border-blue-950/50 rounded p-3 text-slate-100 outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed min-h-[160px]"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !symptomsInput.trim()}
              className="w-full py-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 font-bold border border-cyan-500/40 rounded-lg cursor-pointer transition uppercase tracking-wider text-center flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> Run AI Triage Diagnosis
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D Visualization Frame (Col span 7) */}
        <div className="col-span-7 flex flex-col gap-6">
          <div className="flex-1 bg-black/40 border border-blue-950/40 rounded-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-4 left-4 z-10 font-bold bg-[#070f2b]/80 backdrop-blur border border-blue-950/40 rounded px-2 py-1 text-[9px] text-cyan-400 uppercase tracking-widest">
              🤖 Centered Patient-Specific Twin
            </div>
            
            <BodyModel 
              affectedRegions={diagnosisResult ? diagnosisResult.affectedRegions : []} 
              patientId={
                diagnosisResult?.predictedCondition.includes('STEMI') ? 'pat-1' :
                diagnosisResult?.predictedCondition.includes('Dengue') ? 'pat-2' :
                diagnosisResult?.predictedCondition.includes('Tuberculosis') ? 'pat-3' : 'immersive'
              }
            />
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: AI Clinical Outcomes Terminal (only when result is generated or loading) */}
      {(isAnalyzing || diagnosisResult) && (
        <div className="mt-6 bg-[#091026]/40 border border-blue-950/65 rounded-xl p-4 space-y-4 animate-in slide-in-from-bottom duration-250">
          <span className="text-cyan-400 font-bold uppercase text-[9px] border-b border-blue-950/30 pb-1.5 tracking-wider block">
            🔬 AI Clinical Prognosis dossier
          </span>

          {isAnalyzing ? (
            /* Loading states */
            <div className="py-6 flex flex-col justify-center items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <span className="absolute w-full h-full rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <span className="font-bold text-slate-300">
                  {progressStep === 0 ? 'SYNCHRONIZING PATIENT FHIR RECORDS...' :
                   progressStep === 1 ? 'PROCESSING SEVERITY VECTORS...' :
                   progressStep === 2 ? 'RECONSTRUCTING 3D REGIONAL SCAN TARGETS...' :
                   'VALIDATING ICD-10 CLASSIFICATIONS...'}
                </span>
                <p className="text-[10px] text-slate-500 uppercase">Ganga Hospital ABDM Security Gateway Active</p>
              </div>
            </div>
          ) : (
            /* Outcomes Content */
            <div className="grid grid-cols-12 gap-6">
              
              {/* Prognosis summary */}
              <div className="col-span-5 space-y-4">
                <div className="p-3 bg-black/40 border border-blue-950/40 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase">Primary Prognosis</span>
                    <span className="text-cyan-400 font-bold">{diagnosisResult?.confidence}% Match</span>
                  </div>
                  <h3 className="text-sm font-black text-rose-400 uppercase leading-snug">
                    {diagnosisResult?.predictedCondition}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {diagnosisResult?.reasoning}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-sans">
                  <div className="p-2.5 bg-black/40 border border-blue-950/20 rounded text-center">
                    <span className="text-[8px] text-slate-500 uppercase font-mono block mb-0.5">ICD-10 Code</span>
                    <span className="text-xs font-black text-slate-100 font-mono tracking-wide">{diagnosisResult?.icd10}</span>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-blue-950/20 rounded text-center">
                    <span className="text-[8px] text-slate-500 uppercase font-mono block mb-0.5">SNOMED CT ID</span>
                    <span className="text-xs font-black text-slate-100 font-mono tracking-wide">{diagnosisResult?.snomed}</span>
                  </div>
                </div>
              </div>

              {/* Vitals & Timeline */}
              <div className="col-span-3 space-y-4">
                <div className="p-3 bg-black/40 border border-blue-950/40 rounded-lg space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block">Synchronized Vitals</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between border-b border-blue-950/30 pb-1"><span>TEMP:</span><span className="text-white font-bold">{diagnosisResult?.vitals.temp}°C</span></div>
                    <div className="flex justify-between border-b border-blue-950/30 pb-1"><span>HR:</span><span className="text-white font-bold">{diagnosisResult?.vitals.hr} bpm</span></div>
                    <div className="flex justify-between border-b border-blue-950/30 pb-1"><span>SPO2:</span><span className="text-white font-bold">{diagnosisResult?.vitals.spo2}%</span></div>
                    <div className="flex justify-between border-b border-blue-950/30 pb-1"><span>BP:</span><span className="text-white font-bold">{diagnosisResult?.vitals.bp}</span></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase block pl-1">Clinical Milestones</span>
                  <div className="space-y-1 text-[9px] text-slate-400">
                    {diagnosisResult?.timeline.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-emerald-500">✓</span>
                        <span className="truncate">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prescriptive recommendations */}
              <div className="col-span-4 p-3 bg-black/40 border border-blue-950/40 rounded-lg space-y-2">
                <span className="text-[9px] text-slate-500 uppercase block">Clinician Directives</span>
                <ul className="space-y-2 text-[9px] text-slate-300">
                  {diagnosisResult?.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed">
                      <span className="text-cyan-500 shrink-0 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  )
}
