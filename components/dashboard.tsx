'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Activity, Users, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Sparkles, ChevronRight,
  CheckCircle2, Circle, Stethoscope, Thermometer,
  Droplets, Wind, Brain, ArrowRight, Calendar,
  ShieldCheck, Zap, Minus, BarChart2, ScanLine
} from 'lucide-react'

// ── Static Data ────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Patients Today',
    value: '24',
    sub: '+3 from yesterday',
    icon: Users,
    trend: 'up',
    accent: {
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/10',
      iconBg: 'bg-cyan-950/50 border border-cyan-500/20',
      icon: 'text-cyan-400',
      value: 'text-white',
      trend: 'text-emerald-400',
    }
  },
  {
    label: 'Critical Alerts',
    value: '2',
    sub: 'Require immediate action',
    icon: AlertTriangle,
    trend: 'alert',
    accent: {
      border: 'border-red-500/25',
      bg: 'bg-red-950/10',
      iconBg: 'bg-red-950/50 border border-red-500/20',
      icon: 'text-red-400',
      value: 'text-white',
      trend: 'text-red-400',
    }
  },
  {
    label: 'Avg. Consult Time',
    value: '14m',
    sub: '2 min faster this week',
    icon: Clock,
    trend: 'down',
    accent: {
      border: 'border-violet-500/20',
      bg: 'bg-violet-950/10',
      iconBg: 'bg-violet-950/50 border border-violet-500/20',
      icon: 'text-violet-400',
      value: 'text-white',
      trend: 'text-emerald-400',
    }
  },
  {
    label: 'AI Diagnoses Run',
    value: '18',
    sub: 'Gemini 2.5 engine',
    icon: Brain,
    trend: 'up',
    accent: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/10',
      iconBg: 'bg-emerald-950/50 border border-emerald-500/20',
      icon: 'text-emerald-400',
      value: 'text-white',
      trend: 'text-emerald-400',
    }
  },
]

const ALERTS = [
  {
    id: 1,
    name: 'Rajesh Khanna',
    age: 45,
    condition: 'Suspected STEMI',
    detail: 'ST elevation on 12-lead ECG. Severe retrosternal pain radiating to left arm.',
    level: 'critical',
    time: '2 min ago',
    vitals: { hr: '104', spo2: '94', bp: '150/95', temp: '36.8' }
  },
  {
    id: 2,
    name: 'Meena Iyer',
    age: 67,
    condition: 'Hypertensive Crisis',
    detail: 'BP 210/120 with visual disturbances. Papilloedema suspected.',
    level: 'critical',
    time: '9 min ago',
    vitals: { hr: '96', spo2: '97', bp: '210/120', temp: '37.1' }
  },
  {
    id: 3,
    name: 'Priya Sharma',
    age: 29,
    condition: 'Dengue Grade II — Falling Platelets',
    detail: 'Platelet count 85,000. Haematocrit rising. Capillary leak risk.',
    level: 'warning',
    time: '24 min ago',
    vitals: { hr: '98', spo2: '97', bp: '105/70', temp: '39.4' }
  },
]

const SCHEDULE = [
  { time: '09:30', name: 'Rajesh Khanna', type: 'ACS / Cardiology Follow-up', status: 'done' },
  { time: '10:30', name: 'Raj Kumar', type: 'Wrist Fracture Casting Review', status: 'active' },
  { time: '11:00', name: 'Priya Sharma', type: 'Dengue Monitoring', status: 'upcoming' },
  { time: '12:15', name: 'Amit Patel', type: 'TB DOTS Sputum Check', status: 'upcoming' },
  { time: '14:00', name: 'Lakshmi P.', type: 'Echo — Valvular Screen', status: 'upcoming' },
  { time: '15:30', name: 'Arjun Mehta', type: 'Diabetes Review (HbA1c)', status: 'upcoming' },
]

const RECENT_DX = [
  { condition: 'Acute Coronary Syndrome (STEMI)', patient: 'Rajesh Khanna', organ: 'Heart', confidence: 94, time: '1h ago', flag: true },
  { condition: 'Pulmonary Tuberculosis (Active)', patient: 'Amit Patel', organ: 'Lungs', confidence: 92, time: '2h ago', flag: false },
  { condition: 'Dengue Haemorrhagic Fever Grade II', patient: 'Priya Sharma', organ: 'Liver', confidence: 88, time: '3h ago', flag: false },
  { condition: 'T2DM — Uncontrolled Hyperglycaemia', patient: 'Suresh Nair', organ: 'Pancreas', confidence: 81, time: '5h ago', flag: false },
]

const WARD_VITALS = [
  { label: 'Avg Heart Rate', value: '84', unit: 'bpm', icon: Heart, color: 'text-rose-400', borderColor: 'border-rose-500/20', bg: 'bg-rose-950/20' },
  { label: 'Avg SpO\u2082', value: '96', unit: '%', icon: Wind, color: 'text-sky-400', borderColor: 'border-sky-500/20', bg: 'bg-sky-950/20' },
  { label: 'Avg Temperature', value: '37.4', unit: '\u00b0C', icon: Thermometer, color: 'text-amber-400', borderColor: 'border-amber-500/20', bg: 'bg-amber-950/20' },
  { label: 'Avg Blood Pressure', value: '128/82', unit: 'mmHg', icon: Droplets, color: 'text-violet-400', borderColor: 'border-violet-500/20', bg: 'bg-violet-950/20' },
]

// ── Micro bar chart data (sparkline simulation) ────────────────────────────
const HOURLY_PATIENTS = [2, 3, 5, 4, 6, 5, 7, 8, 6, 9, 7, 8]
const maxBar = Math.max(...HOURLY_PATIENTS)

// ── Component ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id))

  return (
    <div className="w-full h-full overflow-y-auto bg-[#020817] text-slate-100 font-sans custom-scrollbar">
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-7">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1.5">{dateStr}</p>
            <h1 className="text-[26px] font-black text-white tracking-tight leading-none">
              {greeting}, <span className="text-cyan-400">Dr. Priya Nair</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-light">
              {activeAlerts.length > 0
                ? <><span className="text-white font-semibold">{activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}</span> require your attention &mdash; <span className="text-white font-semibold">6 appointments</span> scheduled today.</>
                : <>All patients are stable. <span className="text-white font-semibold">6 appointments</span> scheduled today.</>
              }
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0a1628]/80 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold font-mono tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ABDM Sync Active
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0a1628]/80 border border-blue-500/20 text-slate-400 text-[11px] font-bold font-mono tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              HIPAA Secure
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between gap-4 overflow-hidden ${stat.accent.border} ${stat.accent.bg}`}
              >
                {/* Top glow line */}
                <div className={`absolute top-0 left-6 right-6 h-px ${stat.accent.icon.replace('text-', 'bg-')}/30`} />

                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.accent.iconBg}`}>
                    <Icon className={`w-[18px] h-[18px] ${stat.accent.icon}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-semibold ${stat.accent.trend}`}>
                    {stat.trend === 'up' && <><TrendingUp className="w-3.5 h-3.5" /> Up</>}
                    {stat.trend === 'down' && <><TrendingDown className="w-3.5 h-3.5" /> Improved</>}
                    {stat.trend === 'alert' && <><Zap className="w-3.5 h-3.5 animate-pulse" /> Alert</>}
                  </div>
                </div>

                <div>
                  <div className={`text-[32px] font-black tracking-tight leading-none ${stat.accent.value}`}>{stat.value}</div>
                  <div className="text-[12px] font-semibold text-slate-300 mt-1">{stat.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{stat.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── CRITICAL ALERTS ──────────────────────────────────────────────── */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-full bg-red-500" />
              <h2 className="text-[13px] font-bold text-white uppercase tracking-widest">Clinical Alerts</h2>
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black font-mono">
                {activeAlerts.length}
              </div>
            </div>

            <div className="space-y-2.5">
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border flex items-center gap-5 p-4 ${
                    alert.level === 'critical'
                      ? 'bg-red-950/10 border-red-500/25'
                      : 'bg-amber-950/10 border-amber-500/25'
                  }`}
                >
                  {/* Severity indicator */}
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                      alert.level === 'critical'
                        ? 'bg-red-500 shadow-red-500/50 animate-pulse'
                        : 'bg-amber-500 shadow-amber-500/50'
                    }`} />
                    <div className={`text-[8px] font-black font-mono uppercase tracking-widest ${
                      alert.level === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`}>{alert.level === 'critical' ? 'CRIT' : 'WARN'}</div>
                  </div>

                  <div className="w-px h-10 bg-white/5 shrink-0" />

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-bold text-white">{alert.name}</span>
                      <span className="text-slate-500 text-xs font-mono">· {alert.age}y</span>
                      <span className="text-[10px] font-mono text-slate-600 ml-2">{alert.time}</span>
                    </div>
                    <div className={`text-[12px] font-semibold mb-0.5 ${
                      alert.level === 'critical' ? 'text-red-300' : 'text-amber-300'
                    }`}>{alert.condition}</div>
                    <div className="text-[11px] text-slate-400">{alert.detail}</div>
                  </div>

                  {/* Vitals row */}
                  <div className="shrink-0 grid grid-cols-4 gap-3 text-center">
                    {[
                      { k: 'HR', v: alert.vitals.hr, u: 'bpm', c: 'text-rose-300' },
                      { k: 'SpO\u2082', v: alert.vitals.spo2, u: '%', c: 'text-sky-300' },
                      { k: 'BP', v: alert.vitals.bp, u: '', c: 'text-violet-300' },
                      { k: 'Temp', v: alert.vitals.temp, u: '\u00b0C', c: 'text-amber-300' },
                    ].map(vt => (
                      <div key={vt.k} className="bg-black/30 rounded-lg px-2.5 py-1.5 border border-white/5">
                        <div className="text-[8px] text-slate-600 font-mono uppercase mb-0.5">{vt.k}</div>
                        <div className={`text-[12px] font-black ${vt.c}`}>{vt.v}{vt.u}</div>
                      </div>
                    ))}
                  </div>

                  <div className="w-px h-10 bg-white/5 shrink-0" />

                  {/* Actions */}
                  <div className="shrink-0 flex flex-col gap-2">
                    <Link
                      href="/patients"
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition text-center whitespace-nowrap"
                    >
                      View Patient
                    </Link>
                    <button
                      onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                      className="px-4 py-1.5 text-slate-600 hover:text-slate-400 border border-transparent text-[10px] font-bold uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">

          {/* Schedule — 4 cols */}
          <div className="col-span-4 bg-[#070f24]/70 border border-blue-950/50 rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h2 className="text-[13px] font-bold text-white">Today's Schedule</h2>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">{SCHEDULE.length} total</span>
            </div>

            <div className="space-y-1.5">
              {SCHEDULE.map((apt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    apt.status === 'active'
                      ? 'bg-cyan-500/8 border border-cyan-500/25 shadow-[inset_0_0_12px_rgba(6,182,212,0.04)]'
                      : apt.status === 'done'
                      ? 'opacity-35'
                      : 'border border-transparent hover:bg-white/[0.025]'
                  }`}
                >
                  <span className={`text-[11px] font-black font-mono w-11 shrink-0 ${
                    apt.status === 'active' ? 'text-cyan-400' : 'text-slate-500'
                  }`}>{apt.time}</span>

                  <div className="w-px h-7 bg-blue-950/60 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white leading-tight truncate">{apt.name}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{apt.type}</div>
                  </div>

                  <div className="shrink-0">
                    {apt.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />}
                    {apt.status === 'active' && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-bold font-mono text-cyan-400 uppercase">Now</span>
                      </div>
                    )}
                    {apt.status === 'upcoming' && <Circle className="w-3.5 h-3.5 text-slate-700" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Centre — 8 cols */}
          <div className="col-span-8 flex flex-col gap-5">

            {/* Ward Vitals */}
            <div className="bg-[#070f24]/70 border border-blue-950/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[13px] font-bold text-white">Ward Vitals Overview</h2>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">Average across 24 patients</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {WARD_VITALS.map((v) => {
                  const Icon = v.icon
                  return (
                    <div
                      key={v.label}
                      className={`rounded-xl border ${v.borderColor} ${v.bg} p-4 flex flex-col gap-3`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${v.color}`} />
                        <div className="flex gap-0.5 items-end">
                          {[40, 60, 50, 70, 55, 80, 65].map((h, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-sm opacity-40 ${v.color.replace('text-', 'bg-')}`}
                              style={{ height: `${(h / 80) * 20}px` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className={`text-[22px] font-black leading-none ${v.color}`}>{v.value}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{v.unit}</div>
                        <div className="text-[10px] text-slate-600 mt-1">{v.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent AI Diagnoses */}
            <div className="bg-[#070f24]/70 border border-blue-950/50 rounded-2xl p-5 flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h2 className="text-[13px] font-bold text-white">Recent AI Diagnoses</h2>
                  <span className="text-[9px] font-bold font-mono text-slate-600 uppercase tracking-widest ml-1">Gemini 2.5</span>
                </div>
                <Link
                  href="/symptoms"
                  className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono uppercase tracking-wider transition"
                >
                  New Analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {RECENT_DX.map((dx, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.07] rounded-xl transition group cursor-default"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      dx.flag ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse' : 'bg-slate-700'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-white truncate">{dx.condition}</span>
                        {dx.flag && (
                          <span className="shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-400 font-mono tracking-widest">
                            RED FLAG
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{dx.patient} <span className="text-slate-700 mx-1">·</span> {dx.organ}</div>
                    </div>

                    {/* Confidence bar */}
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dx.confidence >= 90 ? 'bg-red-500' : dx.confidence >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${dx.confidence}%` }}
                        />
                      </div>
                      <div className={`text-[13px] font-black w-10 text-right ${
                        dx.confidence >= 90 ? 'text-red-400' : dx.confidence >= 80 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{dx.confidence}%</div>
                    </div>

                    <div className="text-[10px] text-slate-600 font-mono w-12 text-right shrink-0">{dx.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── PATIENT LOAD CHART + QUICK ACTIONS ──────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">

          {/* Patient load sparkline chart */}
          <div className="col-span-5 bg-[#070f24]/70 border border-blue-950/50 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <h2 className="text-[13px] font-bold text-white">Hourly Patient Load</h2>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">Last 12 hours</span>
            </div>

            <div className="flex items-end gap-2 h-20">
              {HOURLY_PATIENTS.map((val, i) => {
                const heightPct = (val / maxBar) * 100
                const isCurrent = i === HOURLY_PATIENTS.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative flex items-end" style={{ height: '64px' }}>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isCurrent ? 'bg-cyan-500/70' : 'bg-blue-900/60'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">
                      {(i + 7) % 24 < 10 ? `0${(i + 7) % 24}` : (i + 7) % 24}h
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-blue-950/30 text-[10px] text-slate-600 font-mono">
              <span>Peak: 09:00 — 12:00</span>
              <span>Avg: 6 patients/hr</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-7 flex flex-col gap-3">
            <h2 className="text-[13px] font-bold text-white">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3 flex-1">
              {[
                {
                  href: '/symptoms',
                  icon: Sparkles,
                  title: 'AI Diagnostic Assistant',
                  desc: 'Submit symptoms — Gemini differential diagnosis',
                  accent: 'border-cyan-500/20 hover:border-cyan-500/35 hover:shadow-[0_0_24px_rgba(6,182,212,0.07)]',
                  iconBg: 'bg-cyan-950/50 border border-cyan-500/20',
                  iconColor: 'text-cyan-400',
                  arrowColor: 'group-hover:text-cyan-400',
                },
                {
                  href: '/patients',
                  icon: Users,
                  title: 'Patient Workspace',
                  desc: 'Electronic health records, vitals and case notes',
                  accent: 'border-violet-500/20 hover:border-violet-500/35 hover:shadow-[0_0_24px_rgba(139,92,246,0.07)]',
                  iconBg: 'bg-violet-950/50 border border-violet-500/20',
                  iconColor: 'text-violet-400',
                  arrowColor: 'group-hover:text-violet-400',
                },
                {
                  href: '/view-anatomy',
                  icon: ScanLine,
                  title: 'Anatomy Viewer',
                  desc: '3D body mapping — organs labelled after AI diagnosis',
                  accent: 'border-emerald-500/20 hover:border-emerald-500/35 hover:shadow-[0_0_24px_rgba(16,185,129,0.07)]',
                  iconBg: 'bg-emerald-950/50 border border-emerald-500/20',
                  iconColor: 'text-emerald-400',
                  arrowColor: 'group-hover:text-emerald-400',
                },
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`group flex flex-col gap-4 p-4 bg-[#070f24]/70 border rounded-2xl transition-all duration-200 ${action.accent}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.iconBg}`}>
                        <Icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-700 transition-colors ${action.arrowColor}`} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-white">{action.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{action.desc}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-5 border-t border-blue-950/30 text-[10px] text-slate-700 font-mono">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-bold">GANGA HOSPITAL</span>
            <Minus className="w-3 h-3" />
            <span>ABDM Compliant</span>
            <Minus className="w-3 h-3" />
            <span>HIPAA Secure</span>
            <Minus className="w-3 h-3" />
            <span>FHIR Compatible</span>
          </div>
          <span>Gemini 2.5 Clinical Engine &nbsp;·&nbsp; Ver 2.6.1 &nbsp;·&nbsp; SSL Encrypted</span>
        </div>

      </div>
    </div>
  )
}