'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Activity } from 'lucide-react'

interface SymptomInputProps {
  onAnalyze: (symptoms: string, notes: string, gender: string) => Promise<void>
  isLoading: boolean
}

export function SymptomInput({ onAnalyze, isLoading }: SymptomInputProps) {
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [gender, setGender] = useState('Male')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptoms.trim()) return
    await onAnalyze(symptoms, notes, gender)
  }

  const commonSymptoms = [
    'Headache, fever, sore throat',
    'Chest pain, shortness of breath',
    'Nausea, vomiting, abdominal pain',
    'Fatigue, dizziness, weakness',
    'Cough, congestion, runny nose',
  ]

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-blue-600" />
          Patient Scan Initialization
        </h2>
        <p className="text-sm text-gray-600">
          Input symptomatic telemetry. AI will cross-reference and illuminate affected biological systems.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient Context (Gender) */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-blue-600 mb-2">
            Biological Profile (Sex) *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGender('Male')}
              className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${gender === 'Male' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={isLoading}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => setGender('Female')}
              className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition ${gender === 'Female' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              disabled={isLoading}
            >
              Female
            </button>
          </div>
        </div>

        {/* Symptoms Input */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-blue-600 mb-2">
            Primary Telemetry (Symptoms) *
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g., Patient reports persistent cephalalgia for 72h, temp 38°C..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition custom-scrollbar shadow-sm"
            rows={4}
            disabled={isLoading}
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 mb-2">
            Secondary Telemetry (History)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Pre-existing conditions, medications..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition custom-scrollbar shadow-sm"
            rows={2}
            disabled={isLoading}
          />
        </div>

        {/* Quick Templates */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-600 mb-2">Common Profiles:</p>
          <div className="flex flex-col gap-2">
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => setSymptoms(symptom)}
                disabled={isLoading}
                className="text-left px-3 py-2 border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition text-xs text-gray-700 disabled:opacity-50"
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!symptoms.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Telemetry...
              </>
            ) : (
              'Initiate System Scan'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
