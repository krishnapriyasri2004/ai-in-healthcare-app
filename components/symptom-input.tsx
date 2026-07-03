'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Activity, Mic, MicOff, Heart, Thermometer, Wind, AlertCircle } from 'lucide-react'

interface SymptomInputProps {
  onAnalyze: (
    symptoms: string, 
    notes: string, 
    gender: string, 
    vitals?: { temp: string; hr: string; spo2: string; bp: string }
  ) => Promise<void>
  isLoading: boolean
}

export function SymptomInput({ onAnalyze, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [gender, setGender] = useState('Male')
  const [isListening, setIsListening] = useState(false)

  // Vitals State
  const [temp, setTemp] = useState('37.0')
  const [hr, setHr] = useState('75')
  const [spo2, setSpo2] = useState('98')
  const [bp, setBp] = useState('120/80')
  const [showVitals, setShowVitals] = useState(false)

  const handleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.")
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSymptoms(prev => prev + (prev ? ' ' : '') + transcript)
    }

    recognition.start()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) return
    
    const vitalsData = showVitals ? { temp, hr, spo2, bp } : undefined
    await onAnalyze(symptoms, notes, gender, vitalsData)
  }

  const commonSymptoms = [
    'Sharp chest pain radiating to left arm',
    'Severe throbbing headache with neck stiffness',
    'Persistent dry cough with shortness of breath',
    'Sudden dizziness, blurred vision, and weakness',
    'Acute lower abdominal pain with nausea',
  ]

  return (
    <div className="p-6 bg-black/60 backdrop-blur-xl text-gray-100 rounded-xl border border-blue-900/30">
      <div className="mb-6 border-b border-blue-900/30 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          Natural Language Telemetry
        </h2>
        <p className="text-xs text-gray-400">
          Describe the patient\'s symptoms in natural language or dictate using the mic. Enhance with biometrics for precise 3D diagnosis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient Profile */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-2">
            Biological Sex Profile *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGender('Male')}
              className={`flex-1 py-2 px-4 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                gender === 'Male' 
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                  : 'bg-transparent border-blue-900/30 text-gray-400 hover:bg-white/5'
              }`}
              disabled={isLoading}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('Female')}
              className={`flex-1 py-2 px-4 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                gender === 'Female' 
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                  : 'bg-transparent border-blue-900/30 text-gray-400 hover:bg-white/5'
              }`}
              disabled={isLoading}
            >
              Female
            </button>
          </div>
        </div>

        {/* Symptoms Textarea with Speech Dictation */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400">
              Symptom Description *
            </label>
            <button
              type="button"
              onClick={handleSpeech}
              className={`p-1.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                isListening 
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                  : 'bg-blue-950/50 border border-blue-900/50 text-cyan-400 hover:bg-blue-900/30'
              }`}
              title="Dictate symptoms"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., Patient describes sharp chest pain radiating to left shoulder and neck for 30 minutes, accompanied by sweating..."
            className="w-full px-4 py-3 bg-black/40 border border-blue-900/30 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition custom-scrollbar shadow-inner text-sm"
            rows={4}
            disabled={isLoading}
          />
        </div>

        {/* Biometric Vitals Section */}
        <div className="border border-blue-900/20 rounded-lg bg-blue-950/10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVitals(!showVitals)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-gray-400 hover:bg-blue-950/20 transition-all border-b border-blue-900/10"
          >
            <span className="flex items-center gap-1.5">
              <Heart className={`w-3.5 h-3.5 text-cyan-400 ${showVitals ? 'animate-bounce' : ''}`} />
              Biometric Telemetry (Vitals)
            </span>
            <span className="text-[10px] text-cyan-500">{showVitals ? '[-] COLLAPSE' : '[+] EXPAND'}</span>
          </button>

          {showVitals && (
            <div className="p-4 space-y-4 border-t border-blue-900/10">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Temp */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <Thermometer className="w-3 h-3 text-orange-400" /> Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-blue-900/30 rounded text-gray-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                {/* Heart Rate */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-red-500" /> Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-blue-900/30 rounded text-gray-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                {/* SpO2 */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <Wind className="w-3 h-3 text-blue-400" /> Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/50 border border-blue-900/30 rounded text-gray-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
                {/* BP */}
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3 text-purple-400" /> Blood Pressure
                  </label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="e.g. 120/80"
                    className="w-full px-3 py-1.5 bg-black/50 border border-blue-900/30 rounded text-gray-200 text-xs focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Notes */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">
            Clinical History & Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Chronic hypertension, currently on beta-blockers..."
            className="w-full px-4 py-2.5 bg-black/40 border border-blue-900/30 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition custom-scrollbar shadow-inner text-sm"
            rows={2}
            disabled={isLoading}
          />
        </div>

        {/* Common Profiles */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-cyan-500 mb-2">Diagnostic Scenarios:</p>
          <div className="flex flex-col gap-1.5">
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => setSymptoms(symptom)}
                disabled={isLoading}
                className="text-left px-3 py-2 border border-blue-900/20 rounded bg-blue-950/5 hover:bg-blue-900/10 hover:border-blue-900/40 transition-all text-xs text-gray-300 disabled:opacity-50 line-clamp-1"
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!symptoms.trim() || isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-semibold tracking-wide"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                Initializing System Scan...
              </>
            ) : (
              'Diagnose & Align 3D Visualizer'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
