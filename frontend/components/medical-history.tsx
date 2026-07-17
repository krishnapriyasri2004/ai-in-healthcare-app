'use client'

import { useState, useEffect } from 'react'
import { History, Clock, FileText } from 'lucide-react'

interface HistoryRecord {
  id: string
  symptoms: string
  detectedConditions: string
  affectedOrgans: string
  severityScore: number
  createdAt: string
}

export function MedicalHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/medical-history')
      .then((res) => res.json())
      .then((data) => {
        setHistory(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to fetch history:', error)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-blue-600" />
        Patient Archives
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500 flex flex-col items-center">
          <FileText className="w-12 h-12 mb-4 opacity-20" />
          <p>No telemetry records found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <div key={record.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(record.createdAt).toLocaleDateString()}
                </div>
                <span className={`text-xs font-mono font-bold ${
                  record.severityScore >= 75 ? 'text-red-600' :
                  record.severityScore >= 50 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  LVL {record.severityScore}
                </span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-2">
                "{record.symptoms}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
