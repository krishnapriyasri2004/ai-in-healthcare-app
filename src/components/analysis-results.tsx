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
      symptoms?: string
      relevantVitalsHistory?: string
    }>
    recommendations: string[]
    severityScore: number
    differentialDiagnosis?: Array<{
      condition: string
      confidence: number
      severity: 'high' | 'medium' | 'low'
      reasoning: string
    }>
    redFlags?: Array<{
      title: string
      description: string
      alertLevel: 'critical' | 'warning'
    }>
  }
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high':
        return 'bg-rose-950/20 text-rose-400 border-rose-500/30'
      case 'medium':
        return 'bg-amber-950/20 text-amber-400 border-amber-500/30'
      case 'low':
        return 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-slate-900/40 text-slate-400 border-slate-800'
    }
  }

  const getSeverityTextColor = (score: number) => {
    if (score >= 75) return 'text-rose-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-emerald-500'
  }

  const SeverityIcon = analysis.severityScore >= 75 ? ShieldAlert : analysis.severityScore >= 50 ? AlertTriangle : ShieldCheck

  return (
    <div className="space-y-5 text-slate-300 font-mono">
      {/* 1. Critical Red Flag Alert Banner */}
      {analysis.redFlags && analysis.redFlags.length > 0 && (
        <div className="space-y-2">
          {analysis.redFlags.map((flag, idx) => (
            <div 
              key={idx}
              className="border-2 border-red-500 bg-red-950/30 p-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
            >
              <div className="flex items-center gap-2 mb-1.5 text-red-400 font-bold text-xs tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>CRITICAL ALARM: {flag.title}</span>
              </div>
              <p className="text-[11px] text-red-200 leading-relaxed font-sans font-medium">
                {flag.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 2. System Threat Level */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <SeverityIcon className={`w-4 h-4 ${getSeverityTextColor(analysis.severityScore)}`} />
            <h3 className="text-[10px] tracking-wider uppercase text-slate-400">System Threat Level</h3>
          </div>
          <span className={`text-2xl font-black ${getSeverityTextColor(analysis.severityScore)}`}>
            {analysis.severityScore}%
          </span>
        </div>
        
        <div className="w-full bg-slate-950 rounded-full h-1.5 mb-1 relative z-10 overflow-hidden border border-slate-800/40">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              analysis.severityScore >= 75
                ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                : analysis.severityScore >= 50
                  ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
            }`}
            style={{ width: `${analysis.severityScore}%` }}
          />
        </div>
        
        {analysis.severityScore >= 75 && (
          <p className="text-[9px] text-rose-400 tracking-wide mt-2 relative z-10 font-bold uppercase animate-pulse">
            🚨 IMMEDIATE RESUSCITATION / ESI L1 INTERVENTION INDICATED
          </p>
        )}
      </div>

      {/* 3. Primary Suspected Diagnosis */}
      <div>
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Primary Diagnosis Suspect</h3>
        <div className={`p-4 rounded-xl border ${getLikelihoodColor(analysis.confidence)} bg-slate-900/20`}>
          <div className="flex justify-between items-start mb-1.5">
            <p className="font-bold text-slate-100 text-sm tracking-wide">{analysis.predictedCondition}</p>
            <span className="text-[8px] font-mono tracking-widest px-2 py-0.5 rounded border border-current font-black uppercase">
              {analysis.confidence} CONF
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{analysis.reasoning}</p>
        </div>
      </div>

      {/* 4. Ranked Differential Diagnoses */}
      {analysis.differentialDiagnosis && analysis.differentialDiagnosis.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
             Clinical Differential Diagnoses
          </h3>
          <div className="space-y-2">
            {analysis.differentialDiagnosis.map((diff, idx) => {
              const borderCol = diff.severity === 'high' ? 'border-rose-950 text-rose-400' : diff.severity === 'medium' ? 'border-amber-955 text-amber-400' : 'border-emerald-950 text-emerald-400';
              const bgCol = diff.severity === 'high' ? 'bg-rose-950/5' : diff.severity === 'medium' ? 'bg-amber-955/5' : 'bg-emerald-950/5';
              return (
                <div 
                  key={idx} 
                  className={`p-3 border rounded-lg ${bgCol} ${borderCol} flex flex-col gap-1 text-[11px] transition-all hover:bg-slate-900/30`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="text-slate-500 font-normal">#{idx+1}</span> {diff.condition}
                    </span>
                    <span className="font-bold text-xs">{diff.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full ${diff.severity === 'high' ? 'bg-rose-500' : diff.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${diff.confidence}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-relaxed">
                    {diff.reasoning}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. Target Organs Mapped */}
      <div>
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Biosensing Target Organs</h3>
        <div className="flex flex-col gap-2">
          {analysis.affectedRegions.map((region, idx) => {
            const badgeColor = region.confidence === 'high' 
                ? 'bg-rose-950/20 text-rose-400 border-rose-900/40' 
                : region.confidence === 'medium'
                ? 'bg-amber-950/20 text-amber-400 border-amber-900/40'
                : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40';

            return (
              <div
                key={`${region.bodyRegion}-${idx}`}
                className={`p-3 border rounded-lg flex flex-col gap-1.5 ${badgeColor} bg-slate-900/10`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {region.bodyRegion.replace('_', ' ')}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest border border-current px-1.5 rounded font-black">
                    {region.confidence}
                  </span>
                </div>
                <p className="text-slate-100 font-semibold text-xs">{region.condition}</p>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{region.reasoning}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Action Protocols */}
      <div className="pb-4">
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Triage Action Protocols</h3>
        <ul className="space-y-2 font-sans text-xs">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex gap-2.5 text-slate-300 p-3 bg-slate-900/20 border border-slate-800/80 rounded-lg shadow-sm">
              <span className="text-cyan-400 font-bold flex-shrink-0">›</span>
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
