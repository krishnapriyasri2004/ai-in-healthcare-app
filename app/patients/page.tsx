'use client'

import { useState } from 'react'
import { Users, Plus, Heart, Calendar, Search, ClipboardList, ShieldAlert, Award } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female'
  symptoms: string
  notes: string
  vitals: { temp: string; hr: string; spo2: string; bp: string }
  history: Array<{ date: string; diagnosis: string; severity: string }>
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
    history: [
      { date: '2026-06-15', diagnosis: 'Migraine Headache', severity: 'Medium' },
      { date: '2026-04-10', diagnosis: 'Acute Pharyngitis', severity: 'Low' }
    ]
  },
  {
    id: 'pat-2',
    name: 'John Doe',
    age: 52,
    gender: 'Male',
    symptoms: 'Sharp chest pain radiating to left arm, shortness of breath, and mild sweating.',
    notes: 'History of chronic hypertension. High cholesterol.',
    vitals: { temp: '36.8', hr: '104', spo2: '94', bp: '150/95' },
    history: [
      { date: '2026-05-22', diagnosis: 'Hypertensive Crisis', severity: 'High' },
      { date: '2026-01-14', diagnosis: 'Chronic Bronchitis flare-up', severity: 'Medium' }
    ]
  },
  {
    id: 'pat-3',
    name: 'Sarah Jenkins',
    age: 41,
    gender: 'Female',
    symptoms: 'Persistent dry cough, congestion, runny nose, and fatigue.',
    notes: 'No chronic history. Symptoms started 4 days ago.',
    vitals: { temp: '37.1', hr: '74', spo2: '99', bp: '115/75' },
    history: [
      { date: '2026-03-01', diagnosis: 'Seasonal Influenza', severity: 'Low' }
    ]
  }
]

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  const [searchQuery, setSearchQuery] = useState('')

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0]

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
  }

  return (
    <div className="w-full h-full p-8 flex gap-6 overflow-hidden bg-[#020617] font-sans">
      {/* Left panel: Directory registry */}
      <div className="w-96 flex flex-col gap-4 bg-black/60 backdrop-blur-xl border border-blue-950/60 rounded-xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center border-b border-blue-900/30 pb-3">
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
            className="w-full pl-9 pr-4 py-2 bg-black border border-blue-950/50 rounded-lg text-xs outline-none focus:border-cyan-500/40 transition text-gray-300 font-mono"
          />
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredPatients.map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-300 flex justify-between items-start ${
                selectedPatientId === p.id 
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-black/30 border-blue-950/40 hover:bg-white/5'
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
          <div className="bg-[#070f2b]/40 backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div>
              <div className="text-[10px] text-cyan-500 tracking-widest font-bold font-mono uppercase">EHR CENTRAL CLINICAL PROFILE</div>
              <h2 className="text-2xl font-black text-white mt-1.5">{activePatient.name}</h2>
              <div className="text-xs text-gray-400 mt-1 font-mono uppercase">
                Gender: <span className="text-gray-200 font-bold mr-4">{activePatient.gender}</span>
                Age: <span className="text-gray-200 font-bold mr-4">{activePatient.age}</span>
                Active File ID: <span className="text-cyan-400 font-bold">{activePatient.id}</span>
              </div>
            </div>
            <div className="flex gap-3 font-mono text-[10px]">
              <div className="bg-black/40 border border-blue-900/30 p-2 px-3.5 rounded text-center">
                 <div className="text-gray-500 uppercase text-[8px] mb-0.5">Vitals Status</div>
                 <div className="text-green-500 font-bold uppercase">STABLE</div>
              </div>
            </div>
          </div>

          {/* Vitals & Telemetry Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex flex-col gap-1.5 relative overflow-hidden">
              <div className="text-[10px] font-mono text-gray-500 uppercase flex justify-between items-center">
                HEART RATE
                <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.hr} <span className="text-xs text-gray-400 font-normal">BPM</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Resting Pulse</div>
            </div>

            <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">BODY TEMP</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.temp} <span className="text-xs text-gray-400 font-normal">°C</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Core Oral</div>
            </div>

            <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">OXYGEN SAT</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.spo2} <span className="text-xs text-gray-400 font-normal">%</span></div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">SpO2 (Pulse Ox)</div>
            </div>

            <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex flex-col gap-1.5">
              <div className="text-[10px] font-mono text-gray-500 uppercase">BLOOD PRESS.</div>
              <div className="text-xl font-bold text-white tracking-tight">{activePatient.vitals.bp}</div>
              <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">Systolic/Diastolic</div>
            </div>
          </div>

          {/* Diagnosis & clinical notes */}
          <div className="grid grid-cols-2 gap-6">
             <div className="bg-black/50 border border-blue-950/60 p-5 rounded-xl flex flex-col gap-3">
                <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" /> Scanner Transcripts
                </span>
                <div className="p-3 bg-black/60 rounded border border-blue-950/30 font-mono text-xs text-gray-300 min-h-[90px] leading-relaxed">
                   {activePatient.symptoms || "No clinical symptoms registered for active patient. Navigate to scanner screen to analyze symptoms."}
                </div>
             </div>

             <div className="bg-black/50 border border-blue-950/60 p-5 rounded-xl flex flex-col gap-3">
                <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Clinical Case Notes
                </span>
                <div className="p-3 bg-black/60 rounded border border-blue-950/30 font-mono text-xs text-gray-300 min-h-[90px] leading-relaxed">
                   {activePatient.notes || "No general history notes submitted."}
                </div>
             </div>
          </div>

          {/* Historical Scans timeline */}
          <div className="bg-black/40 border border-blue-950/50 p-5 rounded-xl flex flex-col gap-4">
             <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5 border-b border-blue-950/40 pb-2">
               <Calendar className="w-4 h-4" /> Diagnostic Scan Records Timeline
             </span>
             {activePatient.history.length > 0 ? (
               <div className="space-y-3 font-mono text-xs">
                 {activePatient.history.map((record, idx) => (
                   <div key={idx} className="flex justify-between items-center p-3 rounded bg-black/50 border border-blue-950/30">
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
