'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ScanLine,
  CheckCircle2,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const [symptomsText, setSymptomsText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const handleLoading = (e: Event) => {
      const customEvent = e as CustomEvent<{ loading: boolean }>
      setIsAnalyzing(!!customEvent.detail?.loading)
    }
    window.addEventListener('sidebar-loading', handleLoading)
    return () => window.removeEventListener('sidebar-loading', handleLoading)
  }, [])

  const navItems = [
    { href: '/scan', label: 'DASHBOARD', icon: LayoutDashboard },
    { href: '/patients', label: 'PATIENT_DB', icon: Users },
    { href: '/symptoms', label: 'AI_DIAGNOSTICS', icon: Sparkles },
    { href: '/view-anatomy', label: '3D_ANATOMY', icon: ScanLine },
  ]

  return (
    <div className="w-60 h-full bg-surface/40 backdrop-blur-3xl border-r border-primary/20 shadow-2xl flex flex-col justify-between py-6 z-20 shrink-0 overflow-y-auto">
      <div className="flex flex-col gap-2 px-4 font-mono text-xs">
        <div className="text-[10px] text-primary/60 tracking-widest mb-2 border-b border-white/5 pb-2">SYSTEM_MODULES</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-300 group ${
                isActive
                  ? 'bg-primary/20 border-l-4 border-primary text-primary shadow-[0_0_15px_rgba(0,255,255,0.15)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant/70 group-hover:text-on-surface'}`} />
              <span className="tracking-widest">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Quick Symptom Mapper */}
      <div className="px-4 py-4 mx-4 mt-6 glass-panel rounded-lg flex flex-col gap-3 font-mono shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-secondary/50"></div>
        <div className="flex items-center gap-2 text-[10px] text-primary font-bold tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          QUICK_MAPPER
        </div>
        <textarea
          value={symptomsText}
          onChange={(e) => setSymptomsText(e.target.value)}
          placeholder="Enter symptoms..."
          disabled={isAnalyzing}
          className="w-full min-h-[60px] max-h-[100px] p-2 bg-surface-variant/50 border border-white/10 rounded text-[10px] text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition resize-none leading-relaxed"
        />
        <button
          onClick={() => {
            if (!symptomsText.trim() || isAnalyzing) return
            if (pathname === '/scan') {
              window.dispatchEvent(new CustomEvent('sidebar-analyze', { detail: { symptoms: symptomsText } }))
            } else {
              window.location.href = `/ai-in-healthcare/scan?symptoms=${encodeURIComponent(symptomsText)}`
            }
            setSymptomsText('')
          }}
          disabled={!symptomsText.trim() || isAnalyzing}
          className="w-full py-2 bg-primary/10 hover:bg-primary/20 border border-primary text-primary rounded text-[9px] font-bold tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-30 cursor-pointer hud-glow"
        >
          {isAnalyzing ? (
            <>
              <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              PROCESSING
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              MAP TO BODY
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pt-6 mt-6 border-t border-white/5 flex flex-col gap-3 font-mono text-[9px] text-on-surface-variant/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-surface-variant border border-white/10 flex items-center justify-center font-bold font-display text-[11px] text-on-surface-variant">A</div>
          <div>
            <div className="font-display font-bold text-[10px] text-on-surface tracking-widest">AROGYA_AI</div>
            <div className="text-[8px] uppercase tracking-widest text-primary/50 mt-0.5">SECURE NETWORK</div>
          </div>
        </div>
        <div className="space-y-1.5 mt-2 text-[9px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-primary/70" />
            <span>ABDM_COMPLIANT</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-primary/70" />
            <span>FHIR_READY</span>
          </div>
        </div>
      </div>
    </div>
  )
}
