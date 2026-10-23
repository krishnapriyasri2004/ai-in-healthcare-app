import type { Patient } from '@/components/AppContext'

export type VitalStatus = 'normal' | 'high' | 'low' | 'unknown'

// Adult reference ranges used for the coloured status hints
export function vitalStatus(kind: 'hr' | 'temp' | 'spo2' | 'bp' | 'sugar', raw?: string): VitalStatus {
  if (!raw) return 'unknown'
  if (kind === 'bp') {
    const [sys, dia] = raw.split('/').map(Number)
    if (!sys || !dia) return 'unknown'
    if (sys >= 140 || dia >= 90) return 'high'
    if (sys < 90 || dia < 60) return 'low'
    return 'normal'
  }
  const v = parseFloat(raw)
  if (Number.isNaN(v)) return 'unknown'
  const [lo, hi] = { hr: [60, 100], temp: [36.1, 37.5], spo2: [95, 100], sugar: [70, 140] }[kind]
  return v < lo ? 'low' : v > hi ? 'high' : 'normal'
}

export const STATUS_STYLE: Record<VitalStatus, { label: string; cls: string }> = {
  normal:  { label: 'Normal', cls: 'bg-emerald-500/10 text-emerald-300' },
  high:    { label: 'High',   cls: 'bg-red-500/10 text-red-300' },
  low:     { label: 'Low',    cls: 'bg-amber-500/10 text-amber-300' },
  unknown: { label: '—',      cls: 'bg-white/5 text-slate-500' },
}

// Overall triage from how many vitals fall outside the reference ranges
export type Triage = 'Critical' | 'Watch' | 'Stable'
export function triage(p: Patient): Triage {
  const abnormal = (['hr', 'temp', 'spo2', 'bp'] as const)
    .filter(k => { const st = vitalStatus(k, p.vitals[k]); return st === 'high' || st === 'low' }).length
    + (['high', 'low'].includes(vitalStatus('sugar', p.bloodSugar)) ? 1 : 0)
  return abnormal >= 3 ? 'Critical' : abnormal >= 1 ? 'Watch' : 'Stable'
}
export const TRIAGE_STYLE: Record<Triage, { badge: string; dot: string }> = {
  Critical: { badge: 'bg-red-500/10 text-red-300 ring-red-400/25', dot: 'bg-red-400' },
  Watch:    { badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/25', dot: 'bg-amber-400' },
  Stable:   { badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25', dot: 'bg-emerald-400' },
}
