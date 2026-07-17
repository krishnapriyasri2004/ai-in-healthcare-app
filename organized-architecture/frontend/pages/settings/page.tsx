'use client'

import { useState } from 'react'
import { Settings, Sliders, Shield, BrainCircuit, RefreshCw, Cpu, Database, Eye } from 'lucide-react'

export default function SettingsPage() {
  const [modelType, setModelType] = useState('openai/gpt-4o')
  const [threshold, setThreshold] = useState(70)
  const [aiRouting, setAiRouting] = useState(true)
  const [hologramMode, setHologramMode] = useState(true)

  return (
    <div className="w-full h-full p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-surface font-sans">
      
      {/* Header */}
      <div className="glass-panel backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="text-[10px] text-cyan-500 tracking-widest font-bold font-mono uppercase">CLINICAL SCANNER PARAMETERS & METRICS</div>
        <h2 className="text-2xl font-black text-white mt-1.5 uppercase font-sans">System Configurations</h2>
        <p className="text-xs text-gray-400 mt-1 font-mono uppercase">
          Fine-tune the AI diagnostics, rendering pipelines, and telemetry parameters
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        
        {/* Box 1: Diagnostic AI parameters */}
        <div className="bg-black/50 border border-white/10 p-5 rounded-xl flex flex-col gap-4">
          <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-2 border-b border-white/10 pb-2">
            <BrainCircuit className="w-4 h-4" /> AI Diagnosis Engine Settings
          </span>
          
          <div className="space-y-4 font-mono text-xs text-gray-300">
             <div className="flex flex-col gap-1.5">
                <label className="text-gray-500 uppercase text-[10px]">Diagnosis Engine Model</label>
                <select 
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="bg-black border border-blue-950 text-gray-300 rounded p-2 outline-none font-bold focus:border-cyan-500/40 transition"
                >
                   <option value="openai/gpt-4o">OpenAI GPT-4o (Recommended)</option>
                   <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                   <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
             </div>

             <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] text-gray-500">
                   <span className="uppercase">Anomalous Threshold Index</span>
                   <span className="text-cyan-400 font-bold">{threshold}%</span>
                </div>
                <input 
                  type="range"
                  min="30" max="90" step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
             </div>

             <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex flex-col gap-0.5">
                   <span className="font-bold text-white">Dynamic Routing Pipeline</span>
                   <span className="text-[10px] text-gray-500">Redirect alerts to on-duty cardiologists</span>
                </div>
                <button 
                  onClick={() => setAiRouting(!aiRouting)}
                  className={`w-9 h-4.5 rounded-full relative transition-colors ${aiRouting ? 'bg-cyan-600' : 'bg-gray-800'}`}
                >
                   <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${aiRouting ? 'left-5' : 'left-0.5'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Box 2: Visual & Holographic configs */}
        <div className="bg-black/50 border border-white/10 p-5 rounded-xl flex flex-col gap-4">
          <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-2 border-b border-white/10 pb-2">
            <Eye className="w-4 h-4" /> Holographic Renderer Configs
          </span>

          <div className="space-y-4 font-mono text-xs text-gray-300">
             <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                   <span className="font-bold text-white">Luminescence Shader</span>
                   <span className="text-[10px] text-gray-500">Add glowing neon outer borders</span>
                </div>
                <button 
                  onClick={() => setHologramMode(!hologramMode)}
                  className={`w-9 h-4.5 rounded-full relative transition-colors ${hologramMode ? 'bg-cyan-600' : 'bg-gray-800'}`}
                >
                   <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${hologramMode ? 'left-5' : 'left-0.5'}`} />
                </button>
             </div>

             <div className="p-3.5 bg-cyan-950/10 border border-cyan-500/20 rounded-lg flex items-start gap-3">
                <Sliders className="w-4 h-4 text-cyan-400 mt-0.5" />
                <div className="text-[10px] text-gray-400 leading-normal">
                   Adjust the WebGL renderer directly from the <strong>Anatomy Explorer</strong> panel located at the bottom-left of the main viewer console.
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* System info */}
      <div className="glass-panel border border-white/10 p-5 rounded-xl flex flex-col gap-4">
         <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-2 border-b border-white/10 pb-2">
           <Cpu className="w-4 h-4" /> System Telemetry Info
         </span>
         <div className="grid grid-cols-4 gap-4 font-mono text-[10px] text-gray-400">
            <div className="p-3 bg-black/50 rounded border border-white/10">
               <div>INFRASTRUCTURE PORT</div>
               <div className="text-white font-bold mt-1">3000 (LOCAL DEV)</div>
            </div>
            <div className="p-3 bg-black/50 rounded border border-white/10">
               <div>PWA CACHE VERSION</div>
               <div className="text-white font-bold mt-1">SW-V1.4</div>
            </div>
            <div className="p-3 bg-black/50 rounded border border-white/10">
               <div>AI INFERENCE STATUS</div>
               <div className="text-cyan-400 font-bold mt-1">CONNECTED</div>
            </div>
            <div className="p-3 bg-black/50 rounded border border-white/10">
               <div>3D RENDER ENGINE</div>
               <div className="text-white font-bold mt-1">THREE.JS R160</div>
            </div>
         </div>
      </div>

    </div>
  )
}
