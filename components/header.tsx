'use client'

import { Activity } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-8 w-full z-50 bg-[#070f2b]/85 backdrop-blur-md border-b border-blue-950/65 px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-widest text-white uppercase font-sans">METROPOLIS HEALTH SYSTEM</h1>
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
  )
}
