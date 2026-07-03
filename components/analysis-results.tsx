'use client'

import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react'

interface AnalysisResultsProps {
  analysis: {
    predictedCondition: string
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
    affectedRegions: Array<{
      bodyRegion: string
      confidence: 'high' | 'medium' | 'low'
      condition: string
      reasoning: string
    }>
    recommendations: string[]
    severityScore: number
  }
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getSeverityColor = (score: number) => {
    if (score >= 75) return 'text-red-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const SeverityIcon = analysis.severityScore >= 75 ? ShieldAlert : analysis.severityScore >= 50 ? AlertTriangle : ShieldCheck

  return (
    <div className="space-y-6">
      {/* Severity Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <SeverityIcon className={`w-5 h-5 ${getSeverityColor(analysis.severityScore)}`} />
            <h3 className="font-mono text-sm tracking-wider uppercase text-gray-600">System Threat Level</h3>
          </div>
          <span className={`text-3xl font-bold font-mono ${getSeverityColor(analysis.severityScore)}`}>
            {analysis.severityScore}%
          </span>
        </div>
        
        {/* Futuristic Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 relative z-10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              analysis.severityScore >= 75
                ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : analysis.severityScore >= 50
                  ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                  : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
            }`}
            style={{ width: `${analysis.severityScore}%` }}
          />
        </div>
        
        {analysis.severityScore >= 75 && (
          <p className="text-xs text-red-600 font-mono tracking-wide mt-3 relative z-10 font-bold">
            CRITICAL: IMMEDIATE INTERVENTION RECOMMENDED
          </p>
        )}
      </div>

      {/* Detected Conditions */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Identified Primary Condition</h3>
        <div className="space-y-3">
            <div
              className={`p-4 rounded-xl border ${getLikelihoodColor(analysis.confidence)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{analysis.predictedCondition}</p>
                  <p className="text-xs opacity-80 mt-1 leading-relaxed">{analysis.reasoning}</p>
                </div>
                <span className="text-[10px] font-mono tracking-widest px-2 py-1 bg-white/50 rounded uppercase border border-current opacity-80">
                  {analysis.confidence}
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* Affected Regions */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Target Regions</h3>
        <div className="flex flex-col gap-2">
          {analysis.affectedRegions.map((region, idx) => {
            const badgeColor = region.confidence === 'high' 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : region.confidence === 'medium'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200';

            return (
              <div
                key={`${region.bodyRegion}-${idx}`}
                className={`p-3 border rounded-lg flex flex-col gap-1.5 ${badgeColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    {region.bodyRegion}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                    {region.confidence}
                  </span>
                </div>
                <p className="text-sm font-semibold">{region.condition}</p>
                <p className="text-xs opacity-80">{region.reasoning}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="pb-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-3">Action Protocols</h3>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-gray-700 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">›</span>
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
