'use client'

import { BarChart, TrendingUp, AlertTriangle, ShieldCheck, Activity, Users, Clock, Pill } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-[#020617] font-sans">
      
      {/* Header */}
      <div className="bg-[#070f2b]/40 backdrop-blur-xl border border-cyan-500/20 p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="text-[10px] text-cyan-500 tracking-widest font-bold font-mono uppercase">CLINICAL TELEMETRY STATISTICS & AUDITS</div>
        <h2 className="text-2xl font-black text-white mt-1.5 uppercase font-sans">Hospital Analytics Board</h2>
        <p className="text-xs text-gray-400 mt-1 font-mono uppercase">
          General Ward Diagnostics, scanner loads, and pathology distributions
        </p>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div className="font-mono">
            <div className="text-[10px] text-gray-500 uppercase">Scans Initialized</div>
            <div className="text-xl font-bold text-white mt-0.5">1,248</div>
            <div className="text-[8px] text-green-500 mt-0.5">+12.4% THIS MONTH</div>
          </div>
        </div>

        <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="font-mono">
            <div className="text-[10px] text-gray-500 uppercase">Critical Scans</div>
            <div className="text-xl font-bold text-red-500 mt-0.5">24</div>
            <div className="text-[8px] text-red-400 mt-0.5">3 PENDING INTERVENTION</div>
          </div>
        </div>

        <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3.5 bg-green-950/40 border border-green-500/30 rounded-lg text-green-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-mono">
            <div className="text-[10px] text-gray-500 uppercase">AI Diagnosis Accuracy</div>
            <div className="text-xl font-bold text-green-500 mt-0.5">94.2%</div>
            <div className="text-[8px] text-green-400 mt-0.5">VERIFIED BY SENIOR STAFF</div>
          </div>
        </div>

        <div className="bg-black/40 border border-blue-900/40 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-lg text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div className="font-mono">
            <div className="text-[10px] text-gray-500 uppercase">Avg Response Time</div>
            <div className="text-xl font-bold text-white mt-0.5">2.4s</div>
            <div className="text-[8px] text-cyan-400 mt-0.5">REAL-TIME INFERENCE</div>
          </div>
        </div>
      </div>

      {/* Analytics Content Block */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Left widget: Pathology Distribution */}
        <div className="col-span-2 bg-black/50 border border-blue-950/60 p-5 rounded-xl flex flex-col gap-4">
          <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-2">
            <BarChart className="w-4 h-4" /> Pathology Category Load Distribution
          </span>
          
          <div className="space-y-3 font-mono text-[11px] text-gray-300 mt-2">
             <div>
                <div className="flex justify-between mb-1.5">
                   <span>RESPIRATORY SYSTEM (LUNGS, THROAT)</span>
                   <span className="text-cyan-400 font-bold">42%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" style={{ width: '42%' }}></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between mb-1.5">
                   <span>CARDIOVASCULAR SYSTEM (HEART)</span>
                   <span className="text-cyan-400 font-bold">28%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" style={{ width: '28%' }}></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between mb-1.5">
                   <span>NERVOUS SYSTEM (BRAIN, SPINE)</span>
                   <span className="text-cyan-400 font-bold">18%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" style={{ width: '18%' }}></div>
                </div>
             </div>

             <div>
                <div className="flex justify-between mb-1.5">
                   <span>DIGESTIVE SYSTEM (LIVER, INTESTINES)</span>
                   <span className="text-cyan-400 font-bold">12%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" style={{ width: '12%' }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Right widget: Clinical Logs Feed */}
        <div className="bg-black/50 border border-blue-950/60 p-5 rounded-xl flex flex-col gap-3">
          <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Live Telemetry Feed
          </span>
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] custom-scrollbar pr-1 mt-2 text-[10px] font-mono text-gray-400">
             <div className="p-2 bg-black/60 rounded border border-blue-950/30 flex flex-col gap-1">
                <span className="text-cyan-400">07:12:45 UTC</span>
                <p className="text-white leading-relaxed">Elena Rostova: 3D Diagnostic scan ran successfully. High confidence.</p>
             </div>
             <div className="p-2 bg-black/60 rounded border border-blue-950/30 flex flex-col gap-1">
                <span className="text-orange-400">06:58:12 UTC</span>
                <p className="text-white leading-relaxed">John Doe: Heart rate telemetry spikes logged (104 BPM).</p>
             </div>
             <div className="p-2 bg-black/60 rounded border border-blue-950/30 flex flex-col gap-1">
                <span className="text-gray-500">06:30:00 UTC</span>
                <p className="text-white leading-relaxed">System: 3D Holographic Rendering Engine restarted on Port 3000.</p>
             </div>
          </div>
        </div>

      </div>

      {/* Ward Occupancy details */}
      <div className="bg-black/40 border border-blue-950/50 p-5 rounded-xl flex flex-col gap-4">
         <span className="font-bold text-xs uppercase text-cyan-400 font-mono flex items-center gap-2 border-b border-blue-950/40 pb-2">
           <Pill className="w-4 h-4" /> Active Ward Allocation
         </span>
         <div className="grid grid-cols-3 gap-4 font-mono text-xs text-gray-300">
            <div className="p-3.5 bg-black/50 rounded border border-blue-950/30">
               <div className="text-[10px] text-gray-500 mb-0.5 uppercase">Ward A (Cardiology)</div>
               <div className="text-sm font-bold text-white">42 / 50 Beds Occupied</div>
            </div>
            <div className="p-3.5 bg-black/50 rounded border border-blue-950/30">
               <div className="text-[10px] text-gray-500 mb-0.5 uppercase">Ward B (Intensive Care)</div>
               <div className="text-sm font-bold text-red-500">18 / 20 Beds Occupied</div>
            </div>
            <div className="p-3.5 bg-black/50 rounded border border-blue-950/30">
               <div className="text-[10px] text-gray-500 mb-0.5 uppercase">Ward C (General Ward)</div>
               <div className="text-sm font-bold text-white">86 / 100 Beds Occupied</div>
            </div>
         </div>
      </div>

    </div>
  )
}
