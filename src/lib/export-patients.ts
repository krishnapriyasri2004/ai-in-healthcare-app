import type { Patient } from '@/components/AppContext'

const csvCell = (value: string | number | undefined) => {
  const s = value === undefined || value === '' ? 'N/A' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Downloads the patient registry as a UTF-8 CSV that opens cleanly in Excel
export function downloadPatientsCsv(patients: Patient[]) {
  const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Symptoms', 'Clinical Notes', 'Heart Rate (BPM)', 'SpO2 (%)', 'Temperature (°C)', 'Blood Pressure', 'ABHA ID', 'PM-JAY Eligibility', 'Blood Sugar (mg/dL)']
  const rows = patients.map(p => [
    p.id, p.name, p.age, p.gender, p.symptoms, p.notes,
    p.vitals.hr, p.vitals.spo2, p.vitals.temp, p.vitals.bp,
    p.abhaId, p.pmjayEligible, p.bloodSugar,
  ].map(csvCell).join(','))

  const csv = '﻿' + [headers.join(','), ...rows].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `patient_registry_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
