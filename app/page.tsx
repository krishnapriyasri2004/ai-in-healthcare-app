'use client'

import Link from 'next/link'
import { Activity, ShieldCheck, Heart, Stethoscope, ChevronRight, Users, Plus, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar bg-[#020617] text-gray-100 flex flex-col font-sans">
      
      {/* Hero Section */}
      <section className="relative py-20 px-8 flex flex-col items-center justify-center text-center overflow-hidden border-b border-blue-950/40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070f2b]/30 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Glowing Ambient Orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10 gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.1)]">
             <Activity className="w-3.5 h-3.5 animate-pulse" /> ABDM & ABHA INTEGRATED PORTAL
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase leading-none">
            AROGYA AI DIAGNOSTIC CLINIC
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed font-mono">
            Bridging clinical expertise with 3D Holographic Diagnostic intelligence. Empowering Indian clinicians with real-time symptom mapping integrated with ABDM standards.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-4">
            <Link 
              href="/scan" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-all font-mono text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] group"
            >
              LAUNCH DIAGNOSTICS SCANNER 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link 
              href="/patients" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black/40 border border-blue-950/60 hover:bg-white/5 transition-all font-mono text-xs font-bold text-gray-300"
            >
              BROWSE PATIENT REGISTRY
            </Link>
          </div>
        </div>
      </section>

      {/* Hospital Stats Grid */}
      <section className="py-12 px-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-2 font-mono">
          <div className="text-[10px] text-gray-500 uppercase">Interactive Wards</div>
          <div className="text-3xl font-black text-white">4 Active</div>
          <div className="text-[9px] text-cyan-500 uppercase mt-1">Real-time telemetry</div>
        </div>

        <div className="p-5 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-2 font-mono">
          <div className="text-[10px] text-gray-500 uppercase">AI Diagnosis Accuracy</div>
          <div className="text-3xl font-black text-green-500">94.2%</div>
          <div className="text-[9px] text-green-400 uppercase mt-1">Verified by NHA / Senior Staff</div>
        </div>

        <div className="p-5 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-2 font-mono">
          <div className="text-[10px] text-gray-500 uppercase">ABHA Enrolled Patients</div>
          <div className="text-3xl font-black text-white">1,248</div>
          <div className="text-[9px] text-gray-400 uppercase mt-1">Hospital database load</div>
        </div>

        <div className="p-5 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-2 font-mono">
          <div className="text-[10px] text-gray-500 uppercase">Avg Response Time</div>
          <div className="text-3xl font-black text-white">2.4s</div>
          <div className="text-[9px] text-cyan-500 uppercase mt-1">Real-time Inference</div>
        </div>
      </section>

      {/* Interactive 3D Scanner Highlights */}
      <section className="py-16 px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-blue-950/20">
         <div className="flex flex-col gap-5">
            <span className="font-bold text-xs uppercase text-cyan-400 font-mono tracking-widest flex items-center gap-2">
               <Stethoscope className="w-4 h-4" /> CLINICAL DIAGNOSTICS MODULE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase leading-tight">
               HOLOGRAPHIC SYMPTOM MAPPING ON 3D HUMAN ANATOMY
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
               Allowing Indian clinicians to input symptoms via Natural Language, compile diagnostic readouts, and map anomalies directly to anatomical coordinates in our interactive 3D model. Every diagnostic outcome links directly to visual landmarks on the human body.
            </p>
            <div className="flex flex-col gap-3.5 mt-2 font-mono text-xs text-gray-300">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  <span>3D anatomical coordinate-fixed diagnostic indicators</span>
               </div>
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  <span>Live biometrics vitals parsing (Heart rate, SpO2, Temp, Blood Sugar)</span>
               </div>
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-500" />
                  <span>Voice dictation support using Web Speech telemetry</span>
               </div>
            </div>
         </div>

         {/* Teaser Model Panel */}
         <div className="p-8 bg-black/60 border border-blue-950/60 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col gap-6 items-center text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="w-20 h-20 rounded-full bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse">
               <Activity className="w-10 h-10" />
            </div>
            <div>
               <h3 className="font-black text-sm uppercase text-white tracking-widest font-mono">Virtual Health Terminal</h3>
               <p className="text-gray-400 text-xs mt-2 font-mono">Launch the 3D model viewport containing interactive skeletal, cardiovascular, and respiratory system toggles.</p>
            </div>
            <Link 
              href="/scan" 
              className="w-full text-center px-4 py-3 rounded-lg bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/30 transition font-mono text-xs font-bold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              LAUNCH VIRTUAL TERMINAL
            </Link>
         </div>
      </section>

      {/* Specialties sections */}
      <section className="py-16 px-8 max-w-7xl mx-auto w-full border-t border-blue-950/20">
         <h2 className="text-center font-black text-lg uppercase tracking-widest text-cyan-500 font-mono mb-12">
            Clinical Specialties & Systems
         </h2>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Heart className="w-5 h-5 animate-pulse" />
               </div>
               <h3 className="font-bold text-sm text-white font-mono uppercase">Cardiology</h3>
               <p className="text-[11px] text-gray-400 leading-relaxed font-mono">Suspected coronary anomalies, arrhythmia, hypertensive crisis mapping directly to cardiac anchor landmarks.</p>
            </div>

            <div className="p-6 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Activity className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-sm text-white font-mono uppercase">Pulmonology</h3>
               <p className="text-[11px] text-gray-400 leading-relaxed font-mono">Tracheal congestion, bronchitis, dyspnea mapping directly onto the left/right lungs and respiratory pathways.</p>
            </div>

            <div className="p-6 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-yellow-950/40 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Award className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-sm text-white font-mono uppercase">Neurology</h3>
               <p className="text-[11px] text-gray-400 leading-relaxed font-mono">Headache scores, neurovascular spasms, and meningeal inflammations mapped to core brain anchor coordinates.</p>
            </div>

            <div className="p-6 bg-black/40 border border-blue-950/40 rounded-xl flex flex-col gap-3">
               <div className="w-10 h-10 rounded-lg bg-green-950/40 border border-green-500/30 flex items-center justify-center text-green-400">
                  <Stethoscope className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-sm text-white font-mono uppercase">Gastroenterology</h3>
               <p className="text-[11px] text-gray-400 leading-relaxed font-mono">Abdominal pathology mappings, stomach lesions, liver conditions mapping onto digestive systems.</p>
            </div>
         </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="py-8 px-8 text-center border-t border-blue-950/40 text-[10px] text-gray-600 font-mono mt-auto">
         © 2026 Arogya AI Health System. ABDM (Ayushman Bharat Digital Mission) Compliant. 3D models and diagnostic suggestions are for decision-support only.
      </footer>
    </div>
  )
}
