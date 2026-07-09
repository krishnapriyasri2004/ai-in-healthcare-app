'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BodyModel } from './body-model'
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Layers, 
  BarChart3, 
  Bell, 
  Calendar, 
  Route, 
  Settings, 
  History,
  CheckCircle2,
  X,
  AlertTriangle,
  Info,
  Clock,
  BookOpen,
  Shield,
  Activity
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  // Overlay state triggers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
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
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false)
  const [isCarePathwaysOpen, setIsCarePathwaysOpen] = useState(false)
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false)
  const [isAnatomyImmersiveOpen, setIsAnatomyImmersiveOpen] = useState(false)

  // Immersive 3D Cadaver toggles
  const [immersiveSystems, setImmersiveSystems] = useState({
    skeletal: true,
    muscular: true,
    nervous: false,
    cardiovascular: false,
    respiratory: true,
    digestive: true,
    lymphatic: false,
    integumentary: false
  })

  const toggleImmersiveSystem = (key: keyof typeof immersiveSystems) => {
    setImmersiveSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Scanner Event Dispatcher
  const handleAIScanClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname !== '/scan') {
      // Cross-page redirect: route to scan page and trigger scan modal automatically
      window.location.href = '/ai-in-healthcare/scan?triggerScanner=true'
    } else {
      window.dispatchEvent(new CustomEvent('open-ai-scanner'))
    }
  }

  const navItems = [
    { href: '/scan', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/patients', label: 'Patient Workspace', icon: Users },
    { href: '/symptoms', label: 'AI Diagnostic Assistant', icon: Sparkles },
    { 
      href: '#', 
      label: '3D Human Visualization', 
      icon: Layers,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); setIsAnatomyImmersiveOpen(true) }
    },
    { 
      href: '#', 
      label: 'Appointments', 
      icon: Calendar,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); setIsAppointmentsOpen(true) }
    },
    { 
      href: '#', 
      label: 'Care Pathways', 
      icon: Route,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); setIsCarePathwaysOpen(true) }
    },
    { href: '/settings', label: 'Settings', icon: Settings },
    { 
      href: '#', 
      label: 'Audit Logs', 
      icon: History,
      onClick: (e: React.MouseEvent) => { e.preventDefault(); setIsAuditLogsOpen(true) }
    },
  ]

  return (
    <>
      <div className="w-56 h-full bg-[#070f2b]/85 backdrop-blur-xl border-r border-blue-950/50 flex flex-col justify-between py-6 z-20 shadow-[5px_0_20px_rgba(0,0,0,0.3)] select-none overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-xs font-mono text-left border border-transparent text-gray-400 hover:text-slate-200 hover:bg-slate-900/40 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  <span className="truncate tracking-wide">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white font-sans font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-xs font-mono border ${
                isActive 
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]' 
                  : 'text-gray-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="truncate tracking-wide">{item.label}</span>
              </div>
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
            // Clear input after dispatch
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

      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. IMMERSIVE Standalone 3D Cadaver Explorer Overlay */}
      {/* ──────────────────────────────────────────────────────── */}
      {isAnatomyImmersiveOpen && (
        <div className="fixed inset-0 bg-[#020617]/95 z-[120] flex flex-col p-6 font-mono text-xs text-gray-100 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-blue-950/60 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                🦴 IMMERSIVE 3D DIGITAL CADAVER VIEWPORT
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Interactive virtual dissection workspace. Click-to-drag and inspect anatomical layers.</p>
            </div>
            <button 
              onClick={() => setIsAnatomyImmersiveOpen(false)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered full-size viewport */}
          <div className="flex-1 bg-black/40 border border-blue-950/40 rounded-2xl relative overflow-hidden">
            <BodyModel 
              affectedRegions={[]} 
              patientId="immersive"
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2. ALERTS & NOTIFICATIONS Slide-out Drawer */}
      {/* ──────────────────────────────────────────────────────── */}


      {/* ──────────────────────────────────────────────────────── */}
      {/* 3. APPOINTMENTS Dialog Modal */}
      {/* ──────────────────────────────────────────────────────── */}
      {isAppointmentsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-[#070f2b] border border-blue-900/60 rounded-xl w-full max-w-[420px] overflow-hidden flex flex-col shadow-2xl relative font-mono text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/40 px-4 py-3 border-b border-blue-950/60 flex justify-between items-center">
              <span className="font-bold text-xs text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Dr. Priya's Schedule Today
              </span>
              <button 
                onClick={() => setIsAppointmentsOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {[
                { time: '09:30 AM', name: 'Rajesh Khanna', dept: 'ACS / Cardiology Screen', status: 'Completed', color: 'text-green-400 bg-green-950/40 border border-green-500/25' },
                { time: '10:30 AM', name: 'Raj Kumar', dept: 'Wrist Fracture Casting', status: 'In Progress', color: 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/25 animate-pulse' },
                { time: '11:00 AM', name: 'Priya Sharma', dept: 'Fever Review (Dengue)', status: 'Scheduled', color: 'text-slate-400 bg-slate-900 border border-slate-800' },
                { time: '12:15 PM', name: 'Amit Patel', dept: 'DOTS Sputum Smear Check', status: 'Scheduled', color: 'text-slate-400 bg-slate-900 border border-slate-800' },
                { time: '02:00 PM', name: 'Lakshmi P.', dept: 'Echo Screen (Valvular)', status: 'Scheduled', color: 'text-slate-400 bg-slate-900 border border-slate-800' }
              ].map((apt, idx) => (
                <div key={idx} className="p-3 bg-black/40 border border-blue-950/40 rounded flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-cyan-500 font-bold">{apt.time}</span>
                    <h4 className="font-bold text-slate-100 mt-0.5">{apt.name}</h4>
                    <span className="text-[9px] text-slate-500 uppercase">{apt.dept}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${apt.color}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4. CLINICAL CARE PATHWAYS Dialog Modal */}
      {/* ──────────────────────────────────────────────────────── */}
      {isCarePathwaysOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-[#070f2b] border border-blue-900/60 rounded-xl w-full max-w-[500px] overflow-hidden flex flex-col shadow-2xl relative font-mono text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/40 px-4 py-3 border-b border-blue-950/60 flex justify-between items-center">
              <span className="font-bold text-xs text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Route className="w-4 h-4" /> Standard Clinical Care Pathways
              </span>
              <button 
                onClick={() => setIsCarePathwaysOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Path 1 */}
              <div className="p-3 rounded bg-black/40 border border-blue-950/40 space-y-1">
                <span className="text-[9px] text-rose-500 font-bold uppercase">🚨 ACS (STEMI) Standard Protocol</span>
                <p className="text-slate-300 leading-normal text-[10px]">
                  Chest pain → bedside 12-lead ECG stat. If ST elevation: administer Aspirin 325mg + Clopidogrel 300mg oral loading. Activate Cath Lab within 15 minutes.
                </p>
              </div>

              {/* Path 2 */}
              <div className="p-3 rounded bg-black/40 border border-blue-950/40 space-y-1">
                <span className="text-[9px] text-orange-500 font-bold uppercase">🦟 Suspected Dengue Fever Guidelines</span>
                <p className="text-slate-300 leading-normal text-[10px]">
                  High fever → Lab CBC. If platelets &lt; 100,000/uL, monitor closely. hydration hydration Hydrate aggressively using ORS. Strictly avoid Aspirin / Ibuprofen due to bleeding hazards.
                </p>
              </div>

              {/* Path 3 */}
              <div className="p-3 rounded bg-black/40 border border-blue-950/40 space-y-1">
                <span className="text-[9px] text-yellow-500 font-bold uppercase">🎯 Pulmonary Tuberculosis DOTS Path</span>
                <p className="text-slate-300 leading-normal text-[10px]">
                  Productive cough &gt; 2 weeks → Chest X-Ray PA + sputum smear AFB. If AFB Positive: Register in national NIKSHAY portal, initiate DOTS AKT-4 therapy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 5. AUDIT LOGS Dialog Modal */}
      {/* ──────────────────────────────────────────────────────── */}
      {isAuditLogsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-[#070f2b] border border-blue-900/60 rounded-xl w-full max-w-[500px] overflow-hidden flex flex-col shadow-2xl relative font-mono text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-black/40 px-4 py-3 border-b border-blue-950/60 flex justify-between items-center">
              <span className="font-bold text-xs text-cyan-400 tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4" /> HIPAA Security Audit Trail
              </span>
              <button 
                onClick={() => setIsAuditLogsOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Clinician Access Activity Logs (Live Sync)</div>
              <div className="space-y-1.5 text-[9px] max-h-[250px] overflow-y-auto pr-1">
                <div className="p-2 rounded bg-black/50 border border-slate-900 flex justify-between">
                  <span>12:20:15 - dr_priya_n checked ABHA ID (Priya Sharma)</span>
                  <span className="text-green-500">CONSENT OK</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-slate-900 flex justify-between">
                  <span>12:18:42 - dr_priya_n updated diagnostics findings for pat-2</span>
                  <span className="text-cyan-500">RECORD UPDATED</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-slate-900 flex justify-between">
                  <span>12:05:10 - SSL SHA-256 handshake. Encrypted connection.</span>
                  <span className="text-slate-500">SSL OK</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-slate-900 flex justify-between">
                  <span>11:45:22 - Backup synchronization completed with NDHM cloud</span>
                  <span className="text-green-500">SYNC OK</span>
                </div>
                <div className="p-2 rounded bg-black/50 border border-slate-900 flex justify-between">
                  <span>10:30:00 - User dr_priya_n authenticated at workstation-4</span>
                  <span className="text-green-500">AUTH OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
