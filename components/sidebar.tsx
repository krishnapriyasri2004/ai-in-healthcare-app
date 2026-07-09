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
  Activity
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
    return () => {
      window.removeEventListener('sidebar-loading', handleLoading)
    }
  }, [])

  const navItems = [
    { href: '/scan', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patients', label: 'Patient Workspace', icon: Users },
    { href: '/symptoms', label: 'AI Diagnostic Assistant', icon: Sparkles },
    { href: '/view-anatomy', label: 'Anatomy Viewer', icon: ScanLine },
  ]

  return (
    <div className="w-56 h-full bg-[#070f2b]/85 backdrop-blur-xl border-r border-blue-950/50 flex flex-col justify-between py-6 z-20 shadow-[5px_0_20px_rgba(0,0,0,0.3)] select-none overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-xs font-mono border ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-gray-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="truncate tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Quick Symptom Mapper */}
      <div className="px-3 py-2 mt-2 mx-3 bg-[#0a1128]/60 border border-blue-950/50 rounded-xl flex flex-col gap-2 font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          Quick Symptom Mapper
        </div>
        <textarea
          value={symptomsText}
          onChange={(e) => setSymptomsText(e.target.value)}
          placeholder="Enter symptoms (e.g. chest pain, cough, kidney pain...)"
          disabled={isAnalyzing}
          className="w-full min-h-[50px] max-h-[85px] p-2 bg-black/40 border border-blue-950/30 rounded-lg text-[9px] text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-500/40 transition resize-none leading-relaxed custom-scrollbar"
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
          className="w-full py-1.5 bg-cyan-950/60 hover:bg-cyan-900/40 border border-cyan-500/40 rounded-lg text-[8px] font-bold text-cyan-400 uppercase tracking-widest transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <span className="w-2 h-2 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              Mapping...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Map to Body
            </>
          )}
        </button>
      </div>

      {/* Ganga Hospital Compliance Footer */}
      <div className="px-4 pt-4 border-t border-blue-950/40 flex flex-col gap-3 font-mono text-[9px] text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-950/30 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold font-sans text-[10px]">
            G
          </div>
          <div>
            <div className="font-sans font-black text-[10px] text-slate-300 tracking-wide">GANGA HOSPITAL</div>
            <div className="text-[7px] text-slate-500 uppercase -mt-0.5">Caring. Healing. Leading.</div>
          </div>
        </div>

        <div className="space-y-1 mt-1 text-[8px]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>ABDM Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>HIPAA Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>FHIR Compatible</span>
          </div>
        </div>

        <div className="text-[8px] text-slate-600 mt-1 border-t border-blue-950/20 pt-1.5 flex justify-between">
          <span>Ver 2.6.1</span>
          <span>SSL SECURE</span>
        </div>
      </div>
    </div>
  )
}
