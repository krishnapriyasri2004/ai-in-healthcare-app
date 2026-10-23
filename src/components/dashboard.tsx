'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, AlertTriangle, Clock, Bed, Calendar, ChevronRight,
  ScanLine, UserPlus, Download, Check,
} from 'lucide-react'
import { useAppContext } from '@/components/AppContext'
import { downloadPatientsCsv } from '@/lib/export-patients'
import { useNow } from '@/lib/use-now'
import { vitalStatus, triage, TRIAGE_STYLE, type Triage } from '@/lib/vitals'

// ── Static Data ────────────────────────────────────────────────────────────

const STATS = [
  { label: "Today's patients", value: '32', sub: '+12% vs yesterday', icon: Users, tone: 'text-cyan-300 bg-cyan-500/10' },
  { label: 'Critical', value: '4', sub: '1 new since 10 AM', icon: AlertTriangle, tone: 'text-red-300 bg-red-500/10' },
  { label: 'Waiting', value: '8', sub: 'Avg. wait 18 min', icon: Clock, tone: 'text-amber-300 bg-amber-500/10' },
  { label: 'Beds available', value: '18', sub: '82% occupancy', icon: Bed, tone: 'text-emerald-300 bg-emerald-500/10' },
]

const ALERTS = [
  {
    id: 1, name: 'Rajesh Khanna', age: 45, condition: 'Suspected STEMI',
    detail: 'ST elevation on ECG, chest pain radiating to left arm',
    level: 'critical', time: '2 min ago',
    vitals: [['HR', '104'], ['SpO₂', '94%'], ['BP', '150/95']],
  },
  {
    id: 2, name: 'Meena Iyer', age: 67, condition: 'Hypertensive crisis',
    detail: 'BP 210/120 with visual disturbances',
    level: 'critical', time: '9 min ago',
    vitals: [['HR', '96'], ['SpO₂', '97%'], ['BP', '210/120']],
  },
  {
    id: 3, name: 'Priya Sharma', age: 29, condition: 'Dengue — falling platelets',
    detail: 'Platelets 85,000, haematocrit rising',
    level: 'warning', time: '24 min ago',
    vitals: [['HR', '98'], ['Temp', '39.4°'], ['BP', '105/70']],
  },
]

const SCHEDULE = [
  { time: '09:30', name: 'Rajesh Khanna', type: 'Cardiology follow-up', status: 'done' },
  { time: '10:30', name: 'Raj Kumar', type: 'Wrist fracture review', status: 'active' },
  { time: '11:00', name: 'Priya Sharma', type: 'Dengue monitoring', status: 'upcoming' },
  { time: '12:15', name: 'Amit Patel', type: 'TB sputum check', status: 'upcoming' },
  { time: '14:00', name: 'Lakshmi P.', type: 'Echo — valve screen', status: 'upcoming' },
  { time: '15:30', name: 'Arjun Mehta', type: 'Diabetes review', status: 'upcoming' },
]

const TRIAGE_ORDER: Record<Triage, number> = { Critical: 0, Watch: 1, Stable: 2 }

const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

// Vital value coloured by its reference-range status
function Vital({ kind, value, unit = '' }: { kind: 'hr' | 'temp' | 'spo2' | 'bp'; value: string; unit?: string }) {
  const st = vitalStatus(kind, value)
  const color = st === 'high' ? 'text-red-300' : st === 'low' ? 'text-amber-300' : 'text-slate-200'
  return <span className={`tabular-nums ${color}`}>{value}{unit}</span>
}

// ── Component ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const router = useRouter()
  const { patients, setSelectedPatientId } = useAppContext()
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])

  const now = useNow(60_000)
  const hour = now?.getHours()
  const greeting = hour === undefined ? 'Welcome' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) ?? ' '

  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id))
  const sortedPatients = [...patients].sort((a, b) => TRIAGE_ORDER[triage(a)] - TRIAGE_ORDER[triage(b)])
  const nextUp = SCHEDULE.find(s => s.status === 'active') ?? SCHEDULE.find(s => s.status === 'upcoming')

  const openPatient = (id?: string) => {
    if (id) setSelectedPatientId(id)
    router.push('/patients')
  }

  return (
    <div className="w-full min-h-full bg-[radial-gradient(ellipse_at_top,_rgba(14,116,144,0.10),_transparent_55%)] text-slate-100 font-sans">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-slate-500">{dateStr}</p>
            <h1 className="text-[28px] font-bold text-white tracking-tight mt-1">
              {greeting}, <span className="text-cyan-300">Dr. Srinidhi</span>
            </h1>
            <p className="text-[14px] text-slate-400 mt-1">
              {activeAlerts.length > 0
                ? <><span className="text-white font-medium">{activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}</span> need attention</>
                : 'No open alerts'}
              {nextUp && <> · Next: <span className="text-white font-medium">{nextUp.name}</span> at {nextUp.time}</>}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/view-anatomy" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/10 text-[13px] font-medium text-white transition">
              <ScanLine className="w-4 h-4 text-cyan-300" /> 3D anatomy
            </Link>
            <Link href="/patients" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[13px] font-semibold text-slate-950 transition">
              <UserPlus className="w-4 h-4" /> New patient
            </Link>
          </div>
        </header>

        {/* ── Key numbers ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[26px] font-bold text-white leading-none tabular-nums">{stat.value}</div>
                  <div className="text-[13px] text-slate-300 mt-1.5">{stat.label}</div>
                  <div className="text-[12px] text-slate-500 truncate">{stat.sub}</div>
                </div>
              </div>
            )
          })}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left: alerts + patients ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Needs attention */}
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-[15px] font-semibold text-white">Needs attention</h2>
                {activeAlerts.length > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500/15 text-red-300 text-[11px] font-semibold flex items-center justify-center">{activeAlerts.length}</span>
                )}
              </div>

              {activeAlerts.length === 0 ? (
                <div className="px-5 pb-6 pt-2 flex items-center gap-2 text-[13px] text-emerald-300">
                  <Check className="w-4 h-4" /> All alerts handled
                </div>
              ) : (
                <ul className="px-3 pb-3 space-y-1">
                  {activeAlerts.map(alert => {
                    const critical = alert.level === 'critical'
                    return (
                      <li key={alert.id} className="group flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-white/[0.03] transition">
                        <span className={`w-1 self-stretch rounded-full ${critical ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[14px] font-semibold text-white">{alert.name}</span>
                            <span className="text-[12px] text-slate-500">{alert.age} yrs · {alert.time}</span>
                          </div>
                          <div className={`text-[13px] font-medium mt-0.5 ${critical ? 'text-red-300' : 'text-amber-300'}`}>{alert.condition}</div>
                          <div className="text-[12.5px] text-slate-500 truncate">{alert.detail}</div>
                        </div>
                        <div className="hidden md:flex gap-4 shrink-0 text-[12px]">
                          {alert.vitals.map(([k, v]) => (
                            <div key={k} className="text-right">
                              <div className="text-slate-500">{k}</div>
                              <div className="text-white font-semibold tabular-nums">{v}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openPatient(patients.find(p => p.name === alert.name)?.id)}
                            className="h-8 px-3 rounded-lg bg-white text-slate-950 text-[12px] font-semibold hover:bg-slate-200 transition cursor-pointer"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                            className="h-8 px-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 text-[12px] font-medium transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Patients */}
            <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h2 className="text-[15px] font-semibold text-white">My patients</h2>
                  <span className="text-[12px] text-slate-500">{patients.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadPatientsCsv(patients)}
                    title="Export as CSV (opens in Excel)"
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <Link href="/patients" className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-medium text-cyan-300 hover:bg-white/5 transition">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[620px]">
                  <thead>
                    <tr className="text-[11.5px] text-slate-500 border-y border-white/[0.06]">
                      <th className="px-5 py-2.5 font-medium">Patient</th>
                      <th className="px-3 py-2.5 font-medium text-right">HR</th>
                      <th className="px-3 py-2.5 font-medium text-right">BP</th>
                      <th className="px-3 py-2.5 font-medium text-right">SpO₂</th>
                      <th className="px-3 py-2.5 font-medium text-right">Temp</th>
                      <th className="px-5 py-2.5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {sortedPatients.map(p => {
                      const t = triage(p)
                      return (
                        <tr key={p.id} onClick={() => openPatient(p.id)} className="hover:bg-white/[0.03] transition-colors cursor-pointer">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/[0.06] text-slate-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                                {initials(p.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate">{p.name}</div>
                                <div className="text-[12px] text-slate-500">{p.gender} · {p.age} yrs</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right"><Vital kind="hr" value={p.vitals.hr} /></td>
                          <td className="px-3 py-3 text-right"><Vital kind="bp" value={p.vitals.bp} /></td>
                          <td className="px-3 py-3 text-right"><Vital kind="spo2" value={p.vitals.spo2} unit="%" /></td>
                          <td className="px-3 py-3 text-right"><Vital kind="temp" value={p.vitals.temp} unit="°" /></td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full ring-1 text-[11.5px] font-medium ${TRIAGE_STYLE[t].badge}`}>{t}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ── Right: today's schedule ── */}
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] lg:sticky lg:top-6">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h2 className="text-[15px] font-semibold text-white">Today</h2>
              </div>
              <span className="text-[12px] text-slate-500">
                {SCHEDULE.filter(s => s.status === 'done').length}/{SCHEDULE.length} done
              </span>
            </div>
            <ol className="px-5 pb-5">
              {SCHEDULE.map((apt, idx) => (
                <li key={idx} className="relative flex gap-4 pb-4 last:pb-0">
                  {idx < SCHEDULE.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-white/10" />}
                  <span className={`relative mt-1.5 w-[11px] h-[11px] rounded-full shrink-0 ring-4 ring-[#0a0d14] ${
                    apt.status === 'active' ? 'bg-cyan-400' : apt.status === 'done' ? 'bg-emerald-500/60' : 'bg-slate-700'
                  }`} />
                  <div className={`flex-1 min-w-0 rounded-xl px-3 py-2 -mt-1 ${
                    apt.status === 'active' ? 'bg-cyan-500/10 ring-1 ring-cyan-400/25' : ''
                  } ${apt.status === 'done' ? 'opacity-45' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-medium text-white truncate">{apt.name}</span>
                      <span className={`text-[12px] tabular-nums shrink-0 ${apt.status === 'active' ? 'text-cyan-300 font-semibold' : 'text-slate-500'}`}>
                        {apt.status === 'active' ? 'Now' : apt.time}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 truncate mt-0.5">{apt.type}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
