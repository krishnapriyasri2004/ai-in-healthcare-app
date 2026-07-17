'use client'

import { Activity, Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Arogya AI Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary/50 flex items-center justify-center shadow-[0_0_12px_rgba(0,255,255,0.3)] animate-pulse">
            <Activity className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-primary uppercase font-display drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">AROGYA AI</h1>
            <p className="text-[9px] uppercase tracking-wider text-primary/60 font-mono -mt-0.5">
              CLINICAL_OS V2.0.4
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-primary/20" />

        {/* Ganga Hospital Coimbatore */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-secondary/30 border border-secondary/50 flex items-center justify-center text-secondary">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-[11px] font-bold text-on-surface font-display tracking-wide">GANGA HOSPITAL, COIMBATORE</h2>
            <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-mono">
              AI-Powered Decision Support
            </p>
          </div>
        </div>
      </div>

      {/* Connectivity Status Badges */}
      <div className="hidden xl:flex items-center gap-4 text-[9px] font-mono">
        {['HIS', 'PACS', 'LIS', 'RIS', 'ABHA'].map((sys) => (
          <div key={sys} className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-variant/50 border border-white/10">
            <span className="text-on-surface-variant/70">{sys}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
            <span className="text-primary font-bold uppercase text-[8px]">ONLINE</span>
          </div>
        ))}
      </div>

      {/* Date/Time and Doctor Profile */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end font-mono text-[10px]">
          <span className="text-on-surface">04 July 2025</span>
          <span className="text-on-surface-variant mt-0.5 tracking-wider">10:30 AM</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-surface-variant border border-primary/40 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-[0_0_10px_rgba(0,255,255,0.1)]">
            PN
          </div>
          <div>
            <div className="text-[11px] font-bold text-on-surface">Dr. Priya N.</div>
            <div className="text-[9px] font-mono text-primary/70 uppercase tracking-wider">Orthopaedics</div>
          </div>
        </div>
      </div>
    </header>
  )
}
