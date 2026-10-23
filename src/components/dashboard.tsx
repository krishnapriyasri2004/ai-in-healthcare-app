'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart, Activity, Users, AlertTriangle, Clock,
  TrendingUp, TrendingDown, ChevronRight,
  CheckCircle2, Thermometer, Droplets, Wind, Brain,
  ArrowRight, Calendar, ShieldCheck, Minus, BarChart2,
  ScanLine, Download, Bed, UserPlus, Search, X,
} from 'lucide-react'
import { useAppContext } from '@/components/AppContext'
import { downloadPatientsCsv } from '@/lib/export-patients'

// ── Static Data ────────────────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'alert' | 'neutral'

const STATS: Array<{ label: string; value: string; sub: string; icon: typeof Users; trend: Trend; tone: string }> = [
  { label: "Today's Patients", value: '32', sub: '+12% vs yesterday', icon: Users, trend: 'up', tone: 'cyan' },
  { label: 'Critical Patients', value: '4', sub: '+1 since 10 AM', icon: AlertTriangle, trend: 'alert', tone: 'red' },
  { label: 'Waiting', value: '8', sub: '-2 in last hour', icon: Clock, trend: 'down', tone: 'amber' },
  { label: 'Admissions', value: '14', sub: '+3 today', icon: Activity, trend: 'up', tone: 'emerald' },
  { label: 'Discharges', value: '9', sub: 'Target 12 by 5 PM', icon: CheckCircle2, trend: 'neutral', tone: 'slate' },
  { label: 'Available Beds', value: '18', sub: '82% occupancy', icon: Bed, trend: 'neutral', tone: 'blue' },
  { label: 'Avg. Wait Time', value: '18m', sub: '-4 min vs avg', icon: Clock, trend: 'down', tone: 'violet' },
  { label: 'AI Recommendations', value: '27', sub: '94% accuracy', icon: Brain, trend: 'up', tone: 'fuchsia' },
]

// Full class strings so Tailwind can see them
const TONES: Record<string, { chip: string; icon: string }> = {
  cyan:    { chip: 'bg-cyan-500/10 ring-cyan-400/20',       icon: 'text-cyan-300' },
  red:     { chip: 'bg-red-500/10 ring-red-400/20',         icon: 'text-red-300' },
  amber:   { chip: 'bg-amber-500/10 ring-amber-400/20',     icon: 'text-amber-300' },
  emerald: { chip: 'bg-emerald-500/10 ring-emerald-400/20', icon: 'text-emerald-300' },
  slate:   { chip: 'bg-slate-500/10 ring-slate-400/20',     icon: 'text-slate-300' },
  blue:    { chip: 'bg-blue-500/10 ring-blue-400/20',       icon: 'text-blue-300' },
  violet:  { chip: 'bg-violet-500/10 ring-violet-400/20',   icon: 'text-violet-300' },
  fuchsia: { chip: 'bg-fuchsia-500/10 ring-fuchsia-400/20', icon: 'text-fuchsia-300' },
}

const TREND_BADGE: Record<Trend, { label: string; icon: typeof Minus; cls: string }> = {
  up:      { label: 'Up',       icon: TrendingUp,   cls: 'text-emerald-300 bg-emerald-500/10' },
  down:    { label: 'Improved', icon: TrendingDown, cls: 'text-emerald-300 bg-emerald-500/10' },
  alert:   { label: 'Alert',    icon: AlertTriangle, cls: 'text-red-300 bg-red-500/10' },
  neutral: { label: 'Stable',   icon: Minus,        cls: 'text-slate-300 bg-white/5' },
}

const ALERTS = [
  {
    id: 1, name: 'Rajesh Khanna', age: 45, condition: 'Suspected STEMI',
    detail: 'ST elevation on 12-lead ECG. Severe retrosternal pain radiating to left arm.',
    level: 'critical', time: '2 min ago',
    vitals: { hr: '104', spo2: '94', bp: '150/95', temp: '36.8' },
  },
  {
    id: 2, name: 'Meena Iyer', age: 67, condition: 'Hypertensive Crisis',
    detail: 'BP 210/120 with visual disturbances. Papilloedema suspected.',
    level: 'critical', time: '9 min ago',
    vitals: { hr: '96', spo2: '97', bp: '210/120', temp: '37.1' },
  },
  {
    id: 3, name: 'Priya Sharma', age: 29, condition: 'Dengue Grade II — Falling Platelets',
    detail: 'Platelet count 85,000. Haematocrit rising. Capillary leak risk.',
    level: 'warning', time: '24 min ago',
    vitals: { hr: '98', spo2: '97', bp: '105/70', temp: '39.4' },
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
  { label: 'Heart Rate', value: '84', unit: 'bpm', icon: Heart, color: 'text-rose-300', bar: 'bg-rose-400' },
  { label: 'SpO₂', value: '96', unit: '%', icon: Wind, color: 'text-sky-300', bar: 'bg-sky-400' },
  { label: 'Temperature', value: '37.4', unit: '°C', icon: Thermometer, color: 'text-amber-300', bar: 'bg-amber-400' },
  { label: 'Blood Pressure', value: '128/82', unit: 'mmHg', icon: Droplets, color: 'text-violet-300', bar: 'bg-violet-400' },
]
const SPARK = [40, 60, 50, 70, 55, 80, 65]

const HOURLY_PATIENTS = [2, 3, 5, 4, 6, 5, 7, 8, 6, 9, 7, 8]
const maxBar = Math.max(...HOURLY_PATIENTS)

const QUICK_ACTIONS = [
  { href: '/patients', icon: UserPlus, title: 'Patient Workspace', desc: 'Records, vitals and new admissions', tone: 'violet' },
  { href: '/view-anatomy', icon: ScanLine, title: '3D Anatomy Viewer', desc: 'Map symptoms onto the body model', tone: 'emerald' },
]

// ── Small building blocks ──────────────────────────────────────────────────

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, title, meta, action }: {
  icon: typeof Users; title: string; meta?: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
        <h2 className="text-[14px] font-semibold text-white truncate">{title}</h2>
        {meta && <span className="text-[11px] text-slate-500 truncate">{meta}</span>}
      </div>
      {action}
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const router = useRouter()
  const { patients, setSelectedPatientId } = useAppContext()
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])
  const [registryQuery, setRegistryQuery] = useState('')

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id))
  const registry = patients.filter(p =>
    `${p.name} ${p.id} ${p.symptoms}`.toLowerCase().includes(registryQuery.toLowerCase())
  )

  const openPatient = (id?: string) => {
    if (id) setSelectedPatientId(id)
    router.push('/patients')
  }

  return (
    <div className="w-full min-h-full bg-[radial-gradient(ellipse_at_top,_rgba(14,116,144,0.10),_transparent_55%)] text-slate-100 font-sans">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-[12px] text-slate-500 mb-1.5">{dateStr}</p>
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
              {greeting}, <span className="text-cyan-300">Dr. Srinidhi</span>
            </h1>
            <p className="text-[14px] text-slate-400 mt-1.5">
              {activeAlerts.length > 0
                ? <><span className="text-white font-medium">{activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}</span> need your attention · <span className="text-white font-medium">{SCHEDULE.length} appointments</span> today</>
                : <>All patients are stable · <span className="text-white font-medium">{SCHEDULE.length} appointments</span> today</>
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20 text-emerald-300 text-[12px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ABDM sync active
            </span>
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/5 ring-1 ring-white/10 text-slate-300 text-[12px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> HIPAA secure
            </span>
            <Link
              href="/patients"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-cyan-400 text-slate-950 text-[12px] font-semibold hover:bg-cyan-300 transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> New patient
            </Link>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            const tone = TONES[stat.tone]
            const badge = TREND_BADGE[stat.trend]
            const BadgeIcon = badge.icon
            return (
              <Card key={stat.label} className="p-4 sm:p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl ring-1 flex items-center justify-center ${tone.chip}`}>
                    <Icon className={`w-[18px] h-[18px] ${tone.icon}`} />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.cls}`}>
                    <BadgeIcon className="w-3 h-3" /> {badge.label}
                  </span>
                </div>
                <div>
                  <div className="text-[28px] font-bold text-white tracking-tight leading-none tabular-nums">{stat.value}</div>
                  <div className="text-[13px] font-medium text-slate-300 mt-2">{stat.label}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">{stat.sub}</div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* ── CLINICAL ALERTS ──────────────────────────────────────────────── */}
        {activeAlerts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-[15px] font-semibold text-white">Clinical alerts</h2>
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500/15 text-red-300 text-[11px] font-semibold flex items-center justify-center">
                {activeAlerts.length}
              </span>
            </div>

            <div className="grid gap-3">
              {activeAlerts.map(alert => {
                const critical = alert.level === 'critical'
                return (
                  <div
                    key={alert.id}
                    className={`relative overflow-hidden rounded-2xl border bg-white/[0.025] p-4 pl-5 flex flex-col xl:flex-row xl:items-center gap-4 ${
                      critical ? 'border-red-500/25' : 'border-amber-500/25'
                    }`}
                  >
                    <div className={`absolute left-0 inset-y-0 w-1 ${critical ? 'bg-red-500' : 'bg-amber-500'}`} />

                    {/* Patient */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                        critical ? 'bg-red-500/15 text-red-200' : 'bg-amber-500/15 text-amber-200'
                      }`}>
                        {initials(alert.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[15px] font-semibold text-white">{alert.name}</span>
                          <span className="text-[12px] text-slate-500">{alert.age} yrs</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            critical ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'
                          }`}>{critical ? 'Critical' : 'Warning'}</span>
                          <span className="text-[12px] text-slate-500">· {alert.time}</span>
                        </div>
                        <div className={`text-[13px] font-medium mt-1 ${critical ? 'text-red-300' : 'text-amber-300'}`}>{alert.condition}</div>
                        <div className="text-[12.5px] text-slate-400 mt-0.5">{alert.detail}</div>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div className="grid grid-cols-4 gap-2 shrink-0">
                      {[
                        { k: 'HR', v: alert.vitals.hr, u: 'bpm' },
                        { k: 'SpO₂', v: alert.vitals.spo2, u: '%' },
                        { k: 'BP', v: alert.vitals.bp, u: '' },
                        { k: 'Temp', v: alert.vitals.temp, u: '°C' },
                      ].map(vt => (
                        <div key={vt.k} className="rounded-xl bg-black/30 ring-1 ring-white/5 px-3 py-2 min-w-[72px]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide">{vt.k}</div>
                          <div className="text-[14px] font-semibold text-white tabular-nums mt-0.5">
                            {vt.v}<span className="text-[10px] text-slate-500 font-normal ml-0.5">{vt.u}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex xl:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => openPatient(patients.find(p => p.name === alert.name)?.id)}
                        className="h-9 px-4 rounded-xl bg-white text-slate-950 text-[12px] font-semibold hover:bg-slate-200 transition cursor-pointer"
                      >
                        View patient
                      </button>
                      <button
                        onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                        className="h-9 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-[12px] font-medium transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── PATIENT REGISTRY ─────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 className="text-[14px] font-semibold text-white">Patient registry</h2>
              <span className="text-[11px] text-slate-500">{patients.length} records</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={registryQuery}
                  onChange={e => setRegistryQuery(e.target.value)}
                  placeholder="Search patients…"
                  className="w-full h-9 pl-9 pr-8 rounded-xl bg-black/30 border border-white/10 text-[13px] text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15 transition"
                />
                {registryQuery && (
                  <button onClick={() => setRegistryQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white cursor-pointer" aria-label="Clear search">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => downloadPatientsCsv(patients)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/25 text-emerald-300 text-[12px] font-medium hover:bg-emerald-500/15 transition cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          <div className="max-h-[340px] overflow-auto custom-scrollbar border-t border-white/[0.06]">
            <table className="w-full text-left text-[13px] min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-[#0b0f17]">
                <tr className="text-[11px] text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-3 py-3 font-medium">Age / Sex</th>
                  <th className="px-3 py-3 font-medium text-right">Temp</th>
                  <th className="px-3 py-3 font-medium text-right">HR</th>
                  <th className="px-3 py-3 font-medium text-right">SpO₂</th>
                  <th className="px-3 py-3 font-medium text-right">BP</th>
                  <th className="px-3 py-3 font-medium">Presenting symptoms</th>
                  <th className="px-5 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {registry.map((p) => (
                  <tr key={p.id} onClick={() => openPatient(p.id)} className="hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {initials(p.name)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{p.age} · {p.gender}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-200">{p.vitals.temp}°C</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-200">{p.vitals.hr}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-200">{p.vitals.spo2}%</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-200">{p.vitals.bp}</td>
                    <td className="px-3 py-3 text-slate-400 max-w-[280px] truncate" title={p.symptoms}>{p.symptoms}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3" /> ABHA synced
                      </span>
                    </td>
                  </tr>
                ))}
                {registry.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No patients match “{registryQuery}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* Schedule */}
          <Card className="lg:col-span-4 flex flex-col">
            <CardHeader icon={Calendar} title="Today's schedule" meta={`${SCHEDULE.length} appointments`} />
            <ol className="px-5 pb-5 relative">
              {SCHEDULE.map((apt, idx) => (
                <li key={idx} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* timeline rail */}
                  {idx < SCHEDULE.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-white/10" />}
                  <span className={`relative mt-1.5 w-[11px] h-[11px] rounded-full shrink-0 ring-4 ring-[#0a0d14] ${
                    apt.status === 'active' ? 'bg-cyan-400' : apt.status === 'done' ? 'bg-emerald-500/60' : 'bg-slate-700'
                  }`} />
                  <div className={`flex-1 min-w-0 rounded-xl px-3 py-2 -mt-1 ${
                    apt.status === 'active' ? 'bg-cyan-500/10 ring-1 ring-cyan-400/25' : ''
                  } ${apt.status === 'done' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-white truncate">{apt.name}</span>
                      <span className={`text-[12px] tabular-nums shrink-0 ${apt.status === 'active' ? 'text-cyan-300 font-semibold' : 'text-slate-500'}`}>
                        {apt.status === 'active' ? 'Now' : apt.time}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 truncate mt-0.5">{apt.type}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">

            {/* Ward Vitals */}
            <Card>
              <CardHeader icon={Activity} title="Ward vitals" meta="Average across 24 patients" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-5">
                {WARD_VITALS.map((v) => {
                  const Icon = v.icon
                  return (
                    <div key={v.label} className="rounded-xl bg-black/25 ring-1 ring-white/[0.06] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-slate-400">{v.label}</span>
                        <Icon className={`w-4 h-4 ${v.color}`} />
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[22px] font-semibold text-white leading-none tabular-nums">{v.value}</span>
                          <span className="text-[11px] text-slate-500 ml-1">{v.unit}</span>
                        </div>
                        <div className="flex gap-[3px] items-end h-5">
                          {SPARK.map((h, i) => (
                            <div key={i} className={`w-[3px] rounded-full opacity-50 ${v.bar}`} style={{ height: `${(h / 80) * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Recent AI Insights */}
            <Card className="flex-1">
              <CardHeader
                icon={Brain}
                title="Recent AI insights"
                meta="Gemini 2.5"
                action={
                  <Link href="/view-anatomy" className="inline-flex items-center gap-1 text-[12px] text-cyan-300 hover:text-cyan-200 font-medium transition">
                    Open 3D anatomy <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                }
              />
              <div className="px-5 pb-5 space-y-2">
                {RECENT_DX.map((dx, idx) => {
                  const barColor = dx.confidence >= 90 ? 'bg-red-400' : dx.confidence >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                  return (
                    <div key={idx} className="flex items-center gap-4 rounded-xl bg-black/20 ring-1 ring-white/[0.05] px-4 py-3 hover:ring-white/10 transition">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-white truncate">{dx.condition}</span>
                          {dx.flag && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 text-[10px] font-semibold uppercase tracking-wide">Red flag</span>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5">{dx.patient} · {dx.organ} · {dx.time}</div>
                      </div>
                      <div className="hidden sm:block w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${dx.confidence}%` }} />
                      </div>
                      <div className="text-[13px] font-semibold text-white w-10 text-right tabular-nums">{dx.confidence}%</div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* ── PATIENT LOAD + QUICK ACTIONS ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          <Card className="lg:col-span-7">
            <CardHeader icon={BarChart2} title="Hourly patient load" meta="Last 12 hours" />
            <div className="px-5 pb-5">
              <div className="flex items-end gap-2 h-32">
                {HOURLY_PATIENTS.map((val, i) => {
                  const isCurrent = i === HOURLY_PATIENTS.length - 1
                  const h = (i + 7) % 24
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group">
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition tabular-nums">{val}</span>
                      <div
                        className={`w-full rounded-md transition-colors ${isCurrent ? 'bg-cyan-400' : 'bg-slate-700/70 group-hover:bg-slate-600'}`}
                        style={{ height: `${(val / maxBar) * 75}%` }}
                      />
                      <span className="text-[10px] text-slate-500 tabular-nums">{h < 10 ? `0${h}` : h}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06] text-[12px] text-slate-500">
                <span>Peak 09:00 – 12:00</span>
                <span>Avg 6 patients / hr</span>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              const tone = TONES[action.tone]
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/[0.14] p-5 flex flex-col justify-between gap-6 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center ${tone.chip}`}>
                      <Icon className={`w-5 h-5 ${tone.icon}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">{action.title}</div>
                    <div className="text-[12px] text-slate-500 mt-1 leading-relaxed">{action.desc}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-5 border-t border-white/[0.06] text-[11px] text-slate-600">
          <span><span className="text-slate-400 font-semibold">Arogya AI</span> · ABDM compliant · HIPAA secure · FHIR compatible</span>
          <span>Gemini 2.5 clinical engine · v2.6.1</span>
        </div>

      </div>
    </div>
  )
}
