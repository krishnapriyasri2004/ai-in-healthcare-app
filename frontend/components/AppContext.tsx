'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Patient {
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

export interface Condition {
  name: string
  confidence: number
  reasoning: string
}

export interface DiagnosisResult {
  affectedRegions: string[]
  possibleConditions: Condition[]
  redFlag: boolean
  primaryCondition: string
  primaryConfidence: number
  primaryReasoning: string
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

interface AppContextType {
  patients: Patient[]
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>
  selectedPatientId: string
  setSelectedPatientId: React.Dispatch<React.SetStateAction<string>>
  activePatient: Patient
  activeDiagnosisResult: DiagnosisResult | null
  setActiveDiagnosisResult: React.Dispatch<React.SetStateAction<DiagnosisResult | null>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1')
  const [activeDiagnosisResult, setActiveDiagnosisResult] = useState<DiagnosisResult | null>(null)

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0]

  return (
    <AppContext.Provider
      value={{
        patients,
        setPatients,
        selectedPatientId,
        setSelectedPatientId,
        activePatient,
        activeDiagnosisResult,
        setActiveDiagnosisResult
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
