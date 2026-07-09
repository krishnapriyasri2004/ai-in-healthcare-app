'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Activity, Users, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Sparkles, ChevronRight,
  CheckCircle2, Circle, Stethoscope, Thermometer,
  Droplets, Wind, Brain, ArrowRight, Bell, Calendar,
  FileText, ShieldCheck, Zap
} from 'lucide-react'

// ── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Patients Today',
    value: '24',
    sub: '+3 since yesterday',
    icon: Users,
    trend: 'up',
    color: 'cyan'
  },
  {
    label: 'Critical Alerts',
    value: '2',
    sub: 'Require immediate action',
    icon: AlertTriangle,
    trend: 'alert',
    color: 'red'
  },
  {
    label: 'Avg. Consult Time',
    value: '14m',
    sub: '↓ 2 min from last week',
    icon: Clock,
    trend: 'down',
    color: 'violet'
  },
  {
    label: 'AI Diagnoses',
    value: '18',
    sub: 'DeepSeek mapped today',
    icon: Brain,
    trend: 'up',
    color: 'emerald'
  },
]

const ALERTS = [
  {
    id: 1,
    name: 'Rajesh Khanna',
    age: 45,
    condition: 'Suspected STEMI',
    detail: 'ST elevation on ECG, severe chest pain radiating to left arm',
    level: 'critical',
    time: '2 min ago',
    vitals: { hr: '104', spo2: '94', bp: '150/95' }
  },
  {
    id: 2,
    name: 'Meena Iyer',
    age: 67,
    condition: 'Hypertensive Crisis',
    detail: 'BP 210/120 with visual disturbances and severe headache',
    level: 'critical',
    time: '8 min ago',
    vitals: { hr: '96', spo2: '97', bp: '210/120' }
  },
  {
    id: 3,
    name: 'Priya Sharma',
    age: 29,
    condition: 'Dengue Grade II',
    detail: 'Platelet count 85,000 — falling. Monitor closely.',
    level: 'warning',
    time: '24 min ago',
    vitals: { hr: '98', spo2: '97', bp: '105/70' }
  },
]

const SCHEDULE = [
  { time: '09:30', name: 'Rajesh Khanna', type: 'ACS Follow-up', status: 'done' },
  { time: '10:30', name: 'Raj Kumar', type: 'Wrist Fracture Review', status: 'active' },
  { time: '11:00', name: 'Priya Sharma', type: 'Dengue Monitoring', status: 'upcoming' },
  { time: '12:15', name: 'Amit Patel', type: 'TB DOTS Sputum Check', status: 'upcoming' },
  { time: '14:00', name: 'Lakshmi P.', type: 'Echo — Valvular Screen', status: 'upcoming' },
  { time: '15:30', name: 'Arjun Mehta', type: 'Diabetes Review (HbA1c)', status: 'upcoming' },
]

const RECENT_DX = [
  { condition: 'Acute Coronary Syndrome (STEMI)', patient: 'Rajesh Khanna', organ: 'Heart', confidence: 94, time: '1h ago', flag: true },
  { condition: 'Pulmonary Tuberculosis (Active)', patient: 'Amit Patel', organ: 'Lungs', confidence: 92, time: '2h ago', flag: false },
  { condition: 'Dengue Hemorrhagic Fever', patient: 'Priya Sharma', organ: 'Liver', confidence: 88, time: '3h ago', flag: false },
  { condition: 'Type 2 Diabetes (Uncontrolled)', patient: 'Suresh Nair', organ: 'Pancreas', confidence: 81, time: '5h ago', flag: false },
]

const QUICK_VITALS = [
  { label: 'Avg HR', value: '84', unit: 'bpm', icon: Heart, color: 'text-red-400', bg: 'bg-red-950/30 border-red-500/20' },
  { label: 'Avg SpO₂', value: '96', unit: '%', icon: Wind, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-500/20' },
  { label: 'Avg Temp', value: '37.4', unit: '°C', icon: Thermometer, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
  { label: 'Avg BP', value: '128/82', unit: 'mmHg', icon: Droplets, color: 'text-violet-400', bg: 'bg-violet-950/30 border-violet-500/20' },
]

// ── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id))

  return (
    <div className="w-full h-full overflow-y-auto bg-[#020817] text-slate-100 font-sans custom-scrollbar">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {greeting}, <span className="text-cyan-400">Dr. Priya</span> 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              You have <span className="text-white font-semibold">{activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}</span> and <span className="text-white font-semibold">6 appointments</span> today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ABDM Online
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA Secure
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            const colorMap: Record<string, string> = {
              cyan: 'border-cyan-500/20 bg-cyan-950/10',
              red: 'border-red-500/20 bg-red-950/10',
              violet: 'border-violet-500/20 bg-violet-950/10',
              emerald: 'border-emerald-500/20 bg-emerald-950/10',
            }
            const iconMap: Record<string, string> = {
              cyan: 'text-cyan-400 bg-cyan-950/40',
              red: 'text-red-400 bg-red-950/40',
              violet: 'text-violet-400 bg-violet-950/40',
              emerald: 'text-emerald-400 bg-emerald-950/40',
            }
            const valueMap: Record<string, string> = {
              cyan: 'text-cyan-300',
              red: 'text-red-300',
              violet: 'text-violet-300',
              emerald: 'text-emerald-300',
            }
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border p-5 flex flex-col gap-3 ${colorMap[stat.color]}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconMap[stat.color]}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-500" />}
                  {stat.trend === 'alert' && <Zap className="w-4 h-4 text-red-400 animate-pulse" />}
                </div>
                <div>
                  <div className={`text-3xl font-black tracking-tight ${valueMap[stat.color]}`}>{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{stat.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Critical Alerts ── */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Critical Alerts</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-400 text-[10px] font-bold font-mono">{activeAlerts.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 flex items-center gap-4 ${
                    alert.level === 'critical'
                      ? 'bg-red-950/15 border-red-500/30'
                      : 'bg-amber-950/15 border-amber-500/30'
                  }`}
                >
                  {/* Pulse indicator */}
                  <div className={`shrink-0 w-3 h-3 rounded-full ${
                    alert.level === 'critical' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-amber-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wide ${
                        alert.level === 'critical' ? 'bg-red-950/60 text-red-400 border border-red-500/30' : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                      }`}>
                        {alert.level === 'critical' ? '🚨 Critical' : '⚠️ Warning'}
                      </span>
                      <span className="text-white font-bold text-sm">{alert.name}</span>
                      <span className="text-slate-500 text-xs">· Age {alert.age}</span>
                      <span className="text-slate-600 text-[10px] font-mono ml-auto">{alert.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-rose-300">{alert.condition}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{alert.detail}</p>
                  </div>

                  {/* Vitals pills */}
                  <div className="flex gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-[9px] text-slate-600 font-mono uppercase">HR</div>
                      <div className="text-xs font-bold text-red-300">{alert.vitals.hr}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-slate-600 font-mono uppercase">SpO₂</div>
                      <div className="text-xs font-bold text-blue-300">{alert.vitals.spo2}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-slate-600 font-mono uppercase">BP</div>
                      <div className="text-xs font-bold text-violet-300">{alert.vitals.bp}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href="/patients"
                      className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                    >
                      View Patient
                    </Link>
                    <button
                      onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                      className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-12 gap-6">

          {/* Today's Schedule — 5 cols */}
          <div className="col-span-5 bg-[#0a1628]/60 border border-blue-950/50 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Today's Schedule</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{SCHEDULE.length} appointments</span>
            </div>

            <div className="space-y-2">
              {SCHEDULE.map((apt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl transition ${
                    apt.status === 'active'
                      ? 'bg-cyan-950/30 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.06)]'
                      : apt.status === 'done'
                      ? 'opacity-40'
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="shrink-0 w-12 text-center">
                    <span className={`text-xs font-bold font-mono ${apt.status === 'active' ? 'text-cyan-400' : apt.status === 'done' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {apt.time}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-blue-950/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{apt.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{apt.type}</div>
                  </div>
                  <div className="shrink-0">
                    {apt.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {apt.status === 'active' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse block" />}
                    {apt.status === 'upcoming' && <Circle className="w-4 h-4 text-slate-700" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — 7 cols */}
          <div className="col-span-7 flex flex-col gap-6">

            {/* Ward Vitals Overview */}
            <div className="bg-[#0a1628]/60 border border-blue-950/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Ward Vitals Overview</h2>
                <span className="text-[10px] text-slate-500 font-mono ml-auto">Avg across 24 patients</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_VITALS.map((v) => {
                  const Icon = v.icon
                  return (
                    <div key={v.label} className={`rounded-xl border p-3 flex flex-col gap-2 ${v.bg}`}>
                      <Icon className={`w-4 h-4 ${v.color}`} />
                      <div>
                        <div className={`text-lg font-black ${v.color}`}>{v.value}</div>
                        <div className="text-[9px] text-slate-500 font-mono uppercase">{v.unit}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">{v.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent AI Diagnoses */}
            <div className="bg-[#0a1628]/60 border border-blue-950/50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h2 className="text-sm font-bold text-white">Recent AI Diagnoses</h2>
                </div>
                <Link
                  href="/symptoms"
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono uppercase tracking-wider transition"
                >
                  Run New <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {RECENT_DX.map((dx, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition group">
                    {dx.flag && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                    {!dx.flag && (
                      <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{dx.condition}</span>
                        {dx.flag && (
                          <span className="shrink-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 font-mono">Red Flag</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{dx.patient} · {dx.organ}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${dx.confidence >= 90 ? 'text-red-400' : dx.confidence >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {dx.confidence}%
                      </div>
                      <div className="text-[9px] text-slate-600 font-mono">{dx.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/symptoms"
              className="group flex items-center gap-4 p-4 bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AI Diagnostic Assistant</div>
                <div className="text-[11px] text-slate-400">Submit symptoms → DeepSeek analysis</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 ml-auto transition" />
            </Link>

            <Link
              href="/patients"
              className="group flex items-center gap-4 p-4 bg-gradient-to-br from-violet-950/40 to-blue-950/40 border border-violet-500/20 hover:border-violet-500/40 rounded-2xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Patient Workspace</div>
                <div className="text-[11px] text-slate-400">View EHR, vitals & history</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 ml-auto transition" />
            </Link>

            <Link
              href="/view-anatomy"
              className="group flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-950/40 to-blue-950/40 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Anatomy Viewer</div>
                <div className="text-[11px] text-slate-400">3D body mapping & organ labels</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 ml-auto transition" />
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4 border-t border-blue-950/30 text-[10px] text-slate-600 font-mono">
          <span>Ganga Hospital · ABDM Compliant · HIPAA Secure · FHIR Ready</span>
          <span>DeepSeek V3 Clinical Engine · Ver 2.6.1</span>
        </div>

      </div>
    </div>
  )
}