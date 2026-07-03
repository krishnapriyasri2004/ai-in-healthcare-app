'use client'

import { useState } from 'react'
import { BodyModel } from './body-model'
import { SymptomInput } from './symptom-input'
import { AnalysisResults } from './analysis-results'
import { MedicalHistory } from './medical-history'
import { Activity, History, Search, Layers, Box, SlidersHorizontal } from 'lucide-react'

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

type ViewMode = 'input' | 'results' | 'history'

export function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('input')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [patientGender, setPatientGender] = useState('Male')
  
  // Anatomy Explorer State
  const [opacity, setOpacity] = useState(0.9)
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

  const toggleSystem = (key: keyof typeof systems) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAnalyzeSymptoms = async (
    symptoms: string, 
    notes: string, 
    gender: string,
    vitals?: { temp: string; hr: string; spo2: string; bp: string }
  ) => {
    setIsLoading(true)
    setPatientGender(gender)
    try {
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, notes, gender, vitals }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setAnalysis(data.analysis)
      setViewMode('results')
    } catch (error) {
      console.error('Error analyzing symptoms:', error)
      alert('Failed to analyze symptoms. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="absolute top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">MEDI-CORE AI</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-500 font-mono">
                Holographic Explorer System
              </p>
            </div>
          </div>
          
          {/* Top Nav Tools */}
          <div className="flex gap-2">
             <button onClick={() => setViewMode('input')} className={`p-2 rounded border transition-colors ${viewMode === 'input' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-transparent hover:bg-white/10 text-gray-400'}`}><Search className="w-4 h-4" /></button>
             <button onClick={() => setViewMode('results')} disabled={!analysis} className={`p-2 rounded border transition-colors ${viewMode === 'results' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-transparent hover:bg-white/10 text-gray-400 disabled:opacity-50'}`}><Activity className="w-4 h-4" /></button>
             <button onClick={() => setViewMode('history')} className={`p-2 rounded border transition-colors ${viewMode === 'history' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-transparent hover:bg-white/10 text-gray-400'}`}><History className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative flex">
        {/* Background 3D Model Layer */}
        <div className="absolute inset-0 z-0 bg-[#030712]">
           <BodyModel 
             affectedRegions={analysis?.affectedRegions || []} 
             opacity={opacity} 
             wireframe={wireframe}
             activeSystems={systems}
           />
        </div>

        {/* Floating UI Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none flex pt-20 px-6 pb-6 justify-between">
            
          {/* Left Sidebar: Anatomy Explorer */}
          <div className="w-64 pointer-events-auto flex flex-col gap-4">
             <div className="bg-black/40 backdrop-blur-md border border-blue-900/50 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-black/60 px-4 py-3 border-b border-blue-900/50 flex items-center justify-between">
                   <span className="font-semibold text-sm text-gray-200">Anatomy Explorer</span>
                   <Layers className="w-4 h-4 text-blue-400" />
                </div>
                
                <div className="p-4 flex flex-col gap-3">
                   {/* System Toggles */}
                   {Object.entries(systems).map(([system, isActive]) => (
                     <div key={system} className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 capitalize">{system}</span>
                        <button 
                          onClick={() => toggleSystem(system as keyof typeof systems)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-800'}`}
                        >
                           <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${isActive ? 'left-5.5' : 'left-1'}`} />
                        </button>
                     </div>
                   ))}

                   <div className="h-px w-full bg-blue-900/30 my-2" />

                   {/* Render Mode */}
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Wireframe Mode</span>
                      <button 
                        onClick={() => setWireframe(!wireframe)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${wireframe ? 'bg-blue-600' : 'bg-gray-800'}`}
                      >
                         <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${wireframe ? 'left-5.5' : 'left-1'}`} />
                      </button>
                   </div>

                   {/* Opacity Slider */}
                   <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between text-xs text-blue-400">
                         <span>Opacity</span>
                         <span>{Math.round(opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Center Bottom Pill */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
             <div className="bg-black/60 backdrop-blur-md border border-blue-900/50 px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(0,100,255,0.3)]">
                <span className="text-sm font-medium text-blue-400 tracking-wider uppercase">Interactive 3D {patientGender} Anatomy Viewer</span>
             </div>
          </div>

          {/* Right Sidebar: Content Panels */}
          <div className="w-[400px] pointer-events-auto flex flex-col z-20">
            <div className="w-full h-[calc(100vh-120px)] overflow-y-auto rounded-xl bg-black/40 backdrop-blur-xl border border-blue-900/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] custom-scrollbar relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              
              <div className="p-1">
                {viewMode === 'input' && (
                  <SymptomInput onAnalyze={handleAnalyzeSymptoms} isLoading={isLoading} />
                )}

                {viewMode === 'results' && analysis && (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Structure Issues Identified
                    </h2>
                    <AnalysisResults analysis={analysis} />
                  </div>
                )}

                {viewMode === 'history' && (
                  <div className="p-6">
                    <MedicalHistory />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  )
}
