'use client'

import { Activity, Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-8 w-full z-50 bg-[#070f2b]/85 backdrop-blur-md border-b border-blue-950/65 px-6 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-6">
        {/* Arogya AI Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.15)] animate-pulse">
            <Activity className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest text-white uppercase font-sans">AROGYA AI</h1>
            <p className="text-[8px] uppercase tracking-wider text-cyan-500 font-mono -mt-0.5">
              CLINICAL COMMAND CENTER
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-blue-950/50" />

        {/* Ganga Hospital Coimbatore */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200 font-sans tracking-wide">GANGA HOSPITAL, COIMBATORE</h2>
            <p className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">
              AI-Powered Clinical Decision Support
            </p>
          </div>
        </div>
      </div>

      {/* Connectivity Status Badges */}
      <div className="hidden xl:flex items-center gap-4 text-[9px] font-mono">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-blue-950/40">
          <span className="text-gray-500">HIS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold uppercase text-[8px]">Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-blue-950/40">
          <span className="text-gray-500">PACS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold uppercase text-[8px]">Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-blue-950/40">
          <span className="text-gray-500">LIS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold uppercase text-[8px]">Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-blue-950/40">
          <span className="text-gray-500">RIS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold uppercase text-[8px]">Connected</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-blue-950/40">
          <span className="text-gray-500">ABHA</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 font-bold uppercase text-[8px]">Connected</span>
        </div>
      </div>

      {/* Date/Time and Doctor Profile */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end font-mono text-[10px]">
          <span className="text-slate-300">04 July 2025</span>
          <span className="text-slate-500 mt-0.5">10:30 AM</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs uppercase shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            PN
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-200">Dr. Priya N.</div>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Orthopaedics</div>
          </div>
        </div>
      </div>
    </header>
  )
}
