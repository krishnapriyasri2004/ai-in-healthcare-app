'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, Plus, Heart, Calendar, Search, FileText, Sparkles,
  AlertTriangle, Loader2, ExternalLink, Brain, Activity, Download, X,
  Thermometer, Wind, Droplets, Gauge, User, IdCard, Check,
} from 'lucide-react'
import { useAppContext, Patient, DiagnosisResult } from '@/components/AppContext'
import { downloadPatientsCsv } from '@/lib/export-patients'
import { vitalStatus, STATUS_STYLE, triage, TRIAGE_STYLE, type Triage } from '@/lib/vitals'

// ── Helpers ─────────────────────────────────────────────────────────────────

const initials = (name: string) => name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()

// Formats up to 14 digits as XX-XXXX-XXXX-XXXX while typing
const formatAbha = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10), d.slice(10, 14)].filter(Boolean).join('-')
}

const PMJAY_STYLE: Record<string, string> = {
  'Eligible': 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  'Under Verification': 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
}

// ── Form primitives ─────────────────────────────────────────────────────────

const inputBase =
  'w-full h-11 rounded-xl bg-white/[0.04] border text-[14px] text-white placeholder-slate-500 outline-none transition ' +
  'focus:bg-white/[0.06] focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10'

function Field({ label, hint, error, required, children, className = '' }: {
  label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-slate-300">
        {label}{required && <span className="text-cyan-300 ml-0.5">*</span>}
      </span>
      {children}
      {error
        ? <span className="text-[12px] text-red-300">{error}</span>
        : hint && <span className="text-[12px] text-slate-500">{hint}</span>}
    </label>
  )
}

function TextInput({ icon: Icon, suffix, invalid, className = '', ...props }: React.ComponentProps<'input'> & {
  icon?: typeof User; suffix?: string; invalid?: boolean
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />}
      <input
        {...props}
        className={`${inputBase} ${Icon ? 'pl-10' : 'pl-3.5'} ${suffix ? 'pr-14' : 'pr-3.5'} ${
          invalid ? 'border-red-400/60' : 'border-white/10 hover:border-white/20'
        } ${className}`}
      />
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 pointer-events-none">{suffix}</span>
      )}
    </div>
  )
}

function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: T[]; onChange: (v: T) => void
}) {
  return (
    <div className="grid gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`h-9 rounded-lg text-[13px] font-medium transition cursor-pointer ${
            value === opt ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FormSection({ step, title, desc, children }: { step: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="grid md:grid-cols-[200px_1fr] gap-4 md:gap-8 py-6 first:pt-0 border-b border-white/[0.06] last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-cyan-400/15 text-cyan-300 text-[12px] font-semibold flex items-center justify-center">{step}</span>
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
        </div>
        <p className="text-[12.5px] text-slate-500 mt-1.5 leading-relaxed">{desc}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

// ── New patient form ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', age: '', gender: 'Male' as 'Male' | 'Female',
  abha: '', pmjay: 'Not Enrolled' as NonNullable<Patient['pmjayEligible']>,
  hr: '72', temp: '36.6', spo2: '98', bp: '120/80', sugar: '',
  symptoms: '', notes: '',
}
type FormState = typeof EMPTY_FORM

function validate(f: FormState) {
  const e: Partial<Record<keyof FormState, string>> = {}
  if (!f.name.trim()) e.name = 'Please enter the patient’s full name'
  const age = Number(f.age)
  if (!f.age || !Number.isInteger(age) || age < 0 || age > 120) e.age = 'Enter an age between 0 and 120'
  if (f.abha && f.abha.replace(/\D/g, '').length !== 14) e.abha = 'ABHA number has 14 digits'
  const num = (v: string, lo: number, hi: number) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= lo && Number(v) <= hi)
  if (!num(f.hr, 20, 250)) e.hr = '20–250 bpm'
  if (!num(f.temp, 30, 45)) e.temp = '30–45 °C'
  if (!num(f.spo2, 50, 100)) e.spo2 = '50–100 %'
  if (f.bp && !/^\d{2,3}\/\d{2,3}$/.test(f.bp.trim())) e.bp = 'Use format 120/80'
  if (!num(f.sugar, 20, 600)) e.sugar = '20–600 mg/dL'
  return e
}

function AddPatientDialog({ onClose, onSave }: { onClose: () => void; onSave: (p: Patient) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const errors = submitted ? validate(form) : {}

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate(form)).length > 0) return

    onSave({
      id: `pat-${Date.now()}`,
      name: form.name.trim(),
      age: parseInt(form.age),
      gender: form.gender,
      abhaId: form.abha || undefined,
      pmjayEligible: form.pmjay,
      symptoms: form.symptoms.trim() || 'No active symptoms described.',
      notes: form.notes.trim() || 'New clinical registry created.',
      vitals: {
        temp: form.temp.trim() || '36.6',
        hr: form.hr.trim() || '72',
        spo2: form.spo2.trim() || '98',
        bp: form.bp.trim() || '120/80',
      },
      bloodSugar: form.sugar.trim() || undefined,
      history: [],
    })
  }

  const vitalFields: Array<{ key: 'hr' | 'temp' | 'spo2' | 'bp' | 'sugar'; label: string; suffix: string; icon: typeof Heart; placeholder: string; hint: string }> = [
    { key: 'hr', label: 'Heart rate', suffix: 'bpm', icon: Heart, placeholder: '72', hint: 'Normal 60–100' },
    { key: 'temp', label: 'Temperature', suffix: '°C', icon: Thermometer, placeholder: '36.6', hint: 'Normal 36.1–37.5' },
    { key: 'spo2', label: 'SpO₂', suffix: '%', icon: Wind, placeholder: '98', hint: 'Normal ≥ 95' },
    { key: 'bp', label: 'Blood pressure', suffix: 'mmHg', icon: Gauge, placeholder: '120/80', hint: 'Systolic / diastolic' },
    { key: 'sugar', label: 'Blood sugar', suffix: 'mg/dL', icon: Droplets, placeholder: 'Optional', hint: 'Random, normal 70–140' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={onClose}>
      <form
        onSubmit={handleSubmit}
        onMouseDown={e => e.stopPropagation()}
        noValidate
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0b0f17] border border-white/10 shadow-2xl shadow-black/60 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 py-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[18px] font-semibold text-white">Register new patient</h2>
            <p className="text-[13px] text-slate-400 mt-0.5">Fields marked <span className="text-cyan-300">*</span> are required. Vitals are pre-filled with typical values.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 -m-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6">
          <FormSection step={1} title="Personal details" desc="Basic demographics used for the clinical profile.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required error={errors.name} className="sm:col-span-2">
                <TextInput ref={nameRef} icon={User} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Anita Desai" invalid={!!errors.name} autoComplete="off" />
              </Field>
              <Field label="Age" required error={errors.age}>
                <TextInput type="number" inputMode="numeric" min={0} max={120} suffix="years" value={form.age} onChange={e => set('age', e.target.value)} placeholder="35" invalid={!!errors.age} />
              </Field>
              <Field label="Sex">
                <Segmented value={form.gender} options={['Male', 'Female']} onChange={v => set('gender', v)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={2} title="ID & insurance" desc="Link the patient’s ABHA health ID and PM-JAY coverage.">
            <div className="grid gap-4">
              <Field label="ABHA number" hint="Optional · 14 digits" error={errors.abha}>
                <TextInput icon={IdCard} inputMode="numeric" value={form.abha} onChange={e => set('abha', formatAbha(e.target.value))} placeholder="91-1234-5678-9012" invalid={!!errors.abha} className="font-mono tracking-wide" />
              </Field>
              <Field label="PM-JAY eligibility">
                <Segmented value={form.pmjay} options={['Not Enrolled', 'Eligible', 'Under Verification'] as Array<NonNullable<Patient['pmjayEligible']>>} onChange={v => set('pmjay', v)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={3} title="Vitals" desc="Current readings. Status updates live against adult reference ranges.">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vitalFields.map(v => {
                const status = vitalStatus(v.key, form[v.key])
                return (
                  <div key={v.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-slate-300">{v.label}</span>
                      {form[v.key] && !errors[v.key] && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${STATUS_STYLE[status].cls}`}>{STATUS_STYLE[status].label}</span>
                      )}
                    </div>
                    <TextInput icon={v.icon} suffix={v.suffix} inputMode="decimal" value={form[v.key]} onChange={e => set(v.key, e.target.value)} placeholder={v.placeholder} invalid={!!errors[v.key]} className="tabular-nums" />
                    <span className={`text-[12px] ${errors[v.key] ? 'text-red-300' : 'text-slate-500'}`}>{errors[v.key] || v.hint}</span>
                  </div>
                )
              })}
            </div>
          </FormSection>

          <FormSection step={4} title="Clinical information" desc="Symptoms are used by the AI for body mapping when the profile opens.">
            <div className="grid gap-4">
              <Field label="Presenting symptoms" hint={`${form.symptoms.length}/600 · location, onset, duration, associated signs`}>
                <textarea
                  rows={4}
                  maxLength={600}
                  value={form.symptoms}
                  onChange={e => set('symptoms', e.target.value)}
                  placeholder="e.g. Sharp pain in the lower right abdomen since yesterday, nausea, mild fever…"
                  className={`${inputBase} h-auto py-3 px-3.5 leading-relaxed resize-none border-white/10 hover:border-white/20`}
                />
              </Field>
              <Field label="Case notes & history" hint="Past conditions, medications, allergies, lifestyle">
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="e.g. Known hypertensive on amlodipine 5 mg. No known drug allergies."
                  className={`${inputBase} h-auto py-3 px-3.5 leading-relaxed resize-none border-white/10 hover:border-white/20`}
                />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-white/[0.06] bg-white/[0.015] rounded-b-3xl">
          <span className="hidden sm:block text-[12px] text-slate-500">
            {submitted && Object.keys(errors).length > 0
              ? <span className="text-red-300">Please fix {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? 's' : ''} above</span>
              : 'Press Esc to cancel'}
          </span>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="h-10 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer">
              <Check className="w-4 h-4" /> Save patient
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

const HEART_TERMS = ['heart', 'chest pain', 'myocardial', 'cardiac', 'coronary', 'angina', 'stemi', 'nstemi']

export default function PatientsPage() {
  const { patients, setPatients, selectedPatientId, setSelectedPatientId, activePatient, setActiveDiagnosisResult } = useAppContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Symptom input & AI analysis state
  const [symptomInput, setSymptomInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const filteredPatients = patients.filter(p =>
    `${p.name} ${p.id} ${p.abhaId ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset analysis when switching patients
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id)
    setDiagnosisResult(null)
    setErrorMsg(null)
    setSymptomInput('')
  }

  const handleSavePatient = (newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient])
    handleSelectPatient(newPatient.id)
    setShowAddModal(false)
  }

  // Submit symptoms to Gemini via the API route
  const runAnalysis = async (symptoms: string) => {
    setIsAnalyzing(true)
    setDiagnosisResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: activePatient.age,
          sex: activePatient.gender,
          duration: 'As described',
          severity: 'Moderate',
          symptoms
        })
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const rawAnatomy = data.affected_anatomy || []
      const differentialDiagnoses = data.differential_diagnoses || []
      const primary = differentialDiagnoses[0]

      const lowercaseSymptoms = symptoms.toLowerCase()
      const isHeartIssue = HEART_TERMS.some(t => lowercaseSymptoms.includes(t)) ||
        rawAnatomy.some((item: any) => {
          const text = `${item.label || ''} ${item.description || ''}`.toLowerCase()
          return text.includes('heart') || text.includes('cardiac')
        })

      const finalResult: DiagnosisResult = {
        affectedRegions: rawAnatomy.map((item: any) => item.label).filter(Boolean),
        possibleConditions: differentialDiagnoses.map((d: any) => ({
          name: d.condition || 'Unknown',
          confidence: d.confidence || 0,
          reasoning: d.reasoning || ''
        })),
        redFlag: isHeartIssue || !!data.redFlag || (primary && primary.confidence >= 85),
        primaryCondition: primary?.condition || '',
        primaryConfidence: primary?.confidence || 0,
        primaryReasoning: primary?.reasoning || ''
      }

      setDiagnosisResult(finalResult)
      setActiveDiagnosisResult(finalResult) // Sync to global context
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    const symptoms = symptomInput.trim() || activePatient.symptoms
    if (symptoms) runAnalysis(symptoms)
  }

  // Automatically trigger AI analysis when active patient changes and has active symptoms
  useEffect(() => {
    if (!activePatient) return
    const symptoms = activePatient.symptoms
    if (symptoms && symptoms !== 'No active symptoms described.' && symptoms.trim() !== '') {
      runAnalysis(symptoms)
    } else {
      setDiagnosisResult(null)
    }
  }, [selectedPatientId, activePatient?.symptoms])

  // Clear analysis result if no symptom description exists anywhere
  useEffect(() => {
    const activeVal = activePatient?.symptoms || ''
    const hasSymptoms = symptomInput.trim() !== '' || (activeVal !== '' && activeVal !== 'No active symptoms described.')
    if (!hasSymptoms) setDiagnosisResult(null)
  }, [symptomInput, activePatient?.symptoms])

  // Build anatomy viewer URL with pre-filled symptoms for 3D mapping
  const getAnatomyViewerUrl = () => {
    const symptoms = symptomInput.trim() || activePatient.symptoms
    return `/ai-in-healthcare/view-anatomy?symptoms=${encodeURIComponent(symptoms)}&age=${activePatient.age}&sex=${activePatient.gender}`
  }

  const vitals = activePatient ? [
    { key: 'hr' as const, label: 'Heart rate', value: activePatient.vitals.hr, unit: 'bpm', icon: Heart, color: 'text-rose-300' },
    { key: 'temp' as const, label: 'Temperature', value: activePatient.vitals.temp, unit: '°C', icon: Thermometer, color: 'text-amber-300' },
    { key: 'spo2' as const, label: 'SpO₂', value: activePatient.vitals.spo2, unit: '%', icon: Wind, color: 'text-sky-300' },
    { key: 'bp' as const, label: 'Blood pressure', value: activePatient.vitals.bp, unit: 'mmHg', icon: Gauge, color: 'text-violet-300' },
    { key: 'sugar' as const, label: 'Blood sugar', value: activePatient.bloodSugar, unit: 'mg/dL', icon: Droplets, color: 'text-emerald-300' },
  ] : []

  return (
    <div className="w-full min-h-full p-5 sm:p-8 flex flex-col lg:flex-row gap-6 font-sans text-slate-100 bg-[radial-gradient(ellipse_at_top,_rgba(14,116,144,0.08),_transparent_55%)]">

      {/* ── Left panel: Patient directory ── */}
      <aside className="w-full lg:w-[340px] shrink-0 flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-8rem)]">
        <div className="p-5 pb-4 flex flex-col gap-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[16px] font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-300" /> Patients
              </h1>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {patients.length} registered
                {(['Critical', 'Watch'] as Triage[]).map(t => {
                  const n = patients.filter(p => triage(p) === t).length
                  return n > 0 && <span key={t} className="ml-2 inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${TRIAGE_STYLE[t].dot}`} />{n} {t.toLowerCase()}</span>
                })}
              </p>
            </div>
            <button
              onClick={() => downloadPatientsCsv(patients)}
              title="Download registry as CSV (opens in Excel)"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-400/20 hover:bg-emerald-500/15 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add new patient
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, ID or ABHA…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/30 border border-white/10 text-[13px] text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {filteredPatients.map(p => {
            const active = selectedPatientId === p.id
            const t = triage(p)
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition cursor-pointer ${
                  active ? 'bg-cyan-400/10 ring-1 ring-cyan-400/30' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                  active ? 'bg-cyan-400 text-slate-950' : 'bg-white/[0.06] text-slate-300'
                }`}>
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-white truncate">{p.name}</div>
                  <div className="text-[12px] text-slate-500">{p.gender} · {p.age} yrs</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full ring-1 text-[10.5px] font-medium ${TRIAGE_STYLE[t].badge}`}>{t}</span>
                  <span className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1"><Heart className="w-3 h-3" />{p.vitals.hr}</span>
                </div>
              </button>
            )
          })}
          {filteredPatients.length === 0 && (
            <div className="px-3 py-10 text-center text-[13px] text-slate-500">No patients match “{searchQuery}”.</div>
          )}
        </div>
      </aside>

      {/* ── Right panel: Patient record ── */}
      {activePatient && (
        <main className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Profile header */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 text-[22px] font-bold flex items-center justify-center shrink-0">
              {initials(activePatient.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[24px] font-bold text-white tracking-tight">{activePatient.name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-medium">
                  <Check className="w-3 h-3" /> ABHA verified
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 text-[12px]">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">{activePatient.gender}</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">{activePatient.age} years</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300">
                  ABHA <span className="font-mono text-white ml-1">{activePatient.abhaId || '—'}</span>
                </span>
                <span className={`px-2.5 py-1 rounded-lg ring-1 ${PMJAY_STYLE[activePatient.pmjayEligible || ''] || 'bg-white/5 text-slate-400 ring-white/10'}`}>
                  PM-JAY · {activePatient.pmjayEligible || 'Not Enrolled'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-500 font-mono">{activePatient.id}</span>
              </div>
            </div>
            <div className="flex md:flex-col lg:flex-row gap-2 shrink-0">
              <span className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl ring-1 text-[12px] font-medium ${TRIAGE_STYLE[triage(activePatient)].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${TRIAGE_STYLE[triage(activePatient)].dot}`} /> {triage(activePatient)}
              </span>
              <a
                href={getAnatomyViewerUrl()}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/10 ring-1 ring-white/10 text-[12px] font-medium text-white transition"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-300" /> Open in 3D
              </a>
            </div>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {vitals.map(v => {
              const Icon = v.icon
              const status = STATUS_STYLE[vitalStatus(v.key, v.value)]
              return (
                <div key={v.key} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-slate-400">{v.label}</span>
                    <Icon className={`w-4 h-4 ${v.color}`} />
                  </div>
                  <div>
                    <span className="text-[24px] font-semibold text-white tabular-nums leading-none">{v.value || '—'}</span>
                    <span className="text-[12px] text-slate-500 ml-1">{v.unit}</span>
                  </div>
                  <span className={`self-start px-2 py-0.5 rounded-md text-[11px] font-medium ${status.cls}`}>{status.label}</span>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* AI symptom analysis */}
          <div className="xl:col-span-2 rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.05] to-transparent overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-white">AI symptom analysis</h3>
                  <p className="text-[12px] text-slate-500">Differential diagnosis and 3D body mapping</p>
                </div>
              </div>
              <span className="hidden sm:inline text-[11px] text-slate-500">Gemini 2.5</span>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="rounded-xl bg-black/25 ring-1 ring-white/[0.06] p-4">
                <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1.5">Registered symptoms</div>
                <p className="text-[13.5px] text-slate-200 leading-relaxed">{activePatient.symptoms}</p>
              </div>

              <Field label="Add or update symptoms" hint="Leave empty to analyse the registered symptoms · Ctrl + Enter to submit">
                <textarea
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleAnalyze() } }}
                  placeholder={`Describe ${activePatient.name.split(' ')[0]}'s current symptoms — location, severity, duration, associated signs…`}
                  rows={3}
                  className={`${inputBase} h-auto py-3 px-3.5 leading-relaxed resize-none border-white/10 hover:border-white/20`}
                />
              </Field>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isAnalyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing symptoms…</>
                  : <><Sparkles className="w-4 h-4" /> Analyse & map to 3D body</>}
              </button>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 ring-1 ring-red-400/25 text-[13px] text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}

              {diagnosisResult && (
                <div className="flex flex-col gap-5 pt-2 animate-in fade-in duration-300">
                  {diagnosisResult.redFlag && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 ring-1 ring-red-400/30">
                      <AlertTriangle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[14px] font-semibold text-red-200">Red flag — possible emergency</div>
                        <div className="text-[12.5px] text-red-200/70 mt-0.5">Immediate clinical review recommended. Escalate to a senior clinician.</div>
                      </div>
                    </div>
                  )}

                  {diagnosisResult.affectedRegions.length > 0 && (
                    <div>
                      <div className="text-[12px] text-slate-400 font-medium mb-2">Affected regions</div>
                      <div className="flex flex-wrap gap-2">
                        {diagnosisResult.affectedRegions.map(region => (
                          <span key={region} className="px-3 py-1 rounded-full bg-cyan-400/10 ring-1 ring-cyan-400/25 text-[12px] font-medium text-cyan-200">
                            {region.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[12px] text-slate-400 font-medium mb-2">Differential diagnoses</div>
                    <div className="space-y-2">
                      {diagnosisResult.possibleConditions.map((cond, i) => {
                        const bar = cond.confidence >= 85 ? 'bg-red-400' : cond.confidence >= 65 ? 'bg-amber-400' : 'bg-emerald-400'
                        return (
                          <div key={i} className={`p-4 rounded-xl ring-1 ${i === 0 ? 'bg-cyan-400/[0.06] ring-cyan-400/25' : 'bg-black/20 ring-white/[0.06]'}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] font-semibold text-white flex-1 min-w-0">{cond.name}</span>
                              {i === 0 && <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 text-[10px] font-semibold uppercase tracking-wide">Primary</span>}
                              <span className="text-[14px] font-semibold text-white tabular-nums">{cond.confidence}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 mt-2.5 overflow-hidden">
                              <div className={`h-full rounded-full ${bar}`} style={{ width: `${cond.confidence}%` }} />
                            </div>
                            {cond.reasoning && <p className="text-[12.5px] text-slate-400 mt-2.5 leading-relaxed">{cond.reasoning}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <a
                    href={getAnatomyViewerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-xl bg-white/[0.06] hover:bg-white/10 ring-1 ring-white/10 text-[13px] font-semibold text-white inline-flex items-center justify-center gap-2 transition"
                  >
                    <Activity className="w-4 h-4 text-cyan-300" /> View affected regions on 3D anatomy <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Side column: notes, history, coverage */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-400" /> Clinical case notes
              </h3>
              <p className="text-[13.5px] text-slate-300 leading-relaxed">{activePatient.notes || 'No history notes submitted.'}</p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-slate-400" /> Diagnosis history
              </h3>
              {activePatient.history.length > 0 ? (
                <ol className="relative">
                  {activePatient.history.map((record, idx) => (
                    <li key={idx} className="relative flex gap-3.5 pb-5 last:pb-0">
                      {idx < activePatient.history.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-white/10" />}
                      <span className={`relative mt-1.5 w-[11px] h-[11px] rounded-full shrink-0 ring-4 ring-[#0a0d14] ${
                        record.severity === 'High' ? 'bg-red-400' : record.severity === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-white">{record.diagnosis}</div>
                        <div className="text-[12px] text-slate-500 mt-0.5 tabular-nums">
                          {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                          <span className="mx-1.5">·</span>{record.severity} severity
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="py-6 text-center text-[13px] text-slate-500">No previous diagnoses on record.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-3">
                <IdCard className="w-4 h-4 text-slate-400" /> ID &amp; coverage
              </h3>
              <dl className="text-[13px] divide-y divide-white/[0.06]">
                <div className="flex items-center justify-between gap-3 pb-2.5">
                  <dt className="text-slate-500 whitespace-nowrap">ABHA</dt>
                  <dd className="font-mono text-white text-[12.5px] whitespace-nowrap">{activePatient.abhaId || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-slate-500">PM-JAY</dt>
                  <dd className={`px-2 py-0.5 rounded-full ring-1 text-[11.5px] ${PMJAY_STYLE[activePatient.pmjayEligible || ''] || 'bg-white/5 text-slate-400 ring-white/10'}`}>
                    {activePatient.pmjayEligible || 'Not Enrolled'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2.5">
                  <dt className="text-slate-500">Record ID</dt>
                  <dd className="font-mono text-slate-400">{activePatient.id}</dd>
                </div>
              </dl>
            </div>
          </div>
          </div>
        </main>
      )}

      {showAddModal && <AddPatientDialog onClose={() => setShowAddModal(false)} onSave={handleSavePatient} />}
    </div>
  )
}
