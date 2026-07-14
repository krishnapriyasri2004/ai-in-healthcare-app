'use client'

import Link from 'next/link'
import { Activity, ShieldCheck, Heart, Users, AlertTriangle, Clock, Brain, CheckCircle2, Circle, Wind, Thermometer, Stethoscope } from 'lucide-react'
import { useAppContext } from '@/components/AppContext'

export default function Home() {
  const { patients, activePatient } = useAppContext()

  return (
    <div className="w-full h-full min-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar bg-surface text-gray-100 flex flex-col font-sans px-8 py-10 relative">
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#070f2b]/40 via-transparent to-transparent pointer-events-none z-0"></div>
      
      {/* ── HEADER ── */}
      <header className="flex items-end justify-between relative z-10 mb-10 border-b border-white/10 pb-6">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase font-bold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Monday, 13 July 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Good Afternoon, <br/><span className="text-gray-300 font-medium">Dr. Sachin Nair, MD</span>
          </h1>
          <p className="text-[12px] text-gray-400 font-sans mt-2">
            You have <strong className="text-white">3 pending alerts</strong> and <strong className="text-white">{patients.length} appointments</strong> scheduled.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.1)]">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> ABDM Sync Active
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.1)]">
             <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Secure
          </div>
        </div>
      </header>

      {/* ── STATS ROW ── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 relative z-10">
        
        <div className="p-5 glass-panel border border-white/5 rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
             <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
               <Users className="w-4 h-4" />
             </div>
             <div className="text-[10px] text-emerald-400 font-mono tracking-wider flex items-center gap-1"><Activity className="w-3 h-3"/> +3</div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-white tracking-tight">{patients.length}</div>
            <div className="text-[12px] font-medium text-gray-400 font-sans mt-0.5">Patients Today</div>
          </div>
        </div>

        <div className="p-5 glass-panel border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)] rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:border-red-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
             <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
               <AlertTriangle className="w-4 h-4" />
             </div>
             <div className="text-[10px] text-red-400 font-mono tracking-wider flex items-center gap-1">Action Req</div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-white tracking-tight">2</div>
            <div className="text-[12px] font-medium text-gray-400 font-sans mt-0.5">Critical Alerts</div>
          </div>
        </div>

        <div className="p-5 glass-panel border border-white/5 rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
             <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
               <Clock className="w-4 h-4" />
             </div>
             <div className="text-[10px] text-emerald-400 font-mono tracking-wider flex items-center gap-1">-2 min</div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-white tracking-tight">14<span className="text-lg font-medium text-gray-500 ml-1">min</span></div>
            <div className="text-[12px] font-medium text-gray-400 font-sans mt-0.5">Avg. Consult Time</div>
          </div>
        </div>

        <div className="p-5 glass-panel border border-white/5 rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex justify-between items-start">
             <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
               <Brain className="w-4 h-4" />
             </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-white tracking-tight">18</div>
            <div className="text-[12px] font-medium text-gray-400 font-sans mt-0.5">AI Diagnoses Run</div>
          </div>
        </div>

      </section>

      {/* ── CLINICAL ALERTS ── */}
      <section className="mb-10 relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-4 bg-red-500 rounded-full"></div>
          <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-white">Clinical Alerts</h2>
          <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-[10px] font-bold text-red-400">3</span>
        </div>

        <div className="flex flex-col gap-3">
          
          {/* Alert 1 */}
          <div className="p-4 glass-panel border border-red-500/30 rounded-xl flex items-center justify-between group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-red-500"></div>
            
            <div className="flex items-center gap-6 pl-4 flex-1">
              <div className="flex flex-col items-center justify-center w-12 gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider font-mono">CRIT</span>
              </div>
              
              <div className="flex flex-col gap-1 min-w-[300px]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">Rajesh Khanna</span>
                  <span className="text-[10px] text-gray-400 font-mono">45y</span>
                  <span className="text-[10px] text-gray-500 font-mono ml-2">2 min ago</span>
                </div>
                <div className="text-[11px] text-red-400 font-bold">Suspected STEMI</div>
                <div className="text-[10px] text-gray-400">ST elevation on 12-lead ECG. Severe retrosternal pain radiating to left arm.</div>
              </div>

              {/* Vitals */}
              <div className="flex gap-4 ml-auto mr-8 items-center bg-black/40 rounded-lg p-2.5 border border-white/5">
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">HR</span>
                   <span className="text-xs font-black text-red-400">104<span className="text-[8px] font-normal text-red-400/70 ml-0.5">bpm</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">SpO₂</span>
                   <span className="text-xs font-black text-amber-400">94<span className="text-[8px] font-normal text-amber-400/70 ml-0.5">%</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">BP</span>
                   <span className="text-xs font-black text-red-400">150/95</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">Temp</span>
                   <span className="text-xs font-black text-white">36.8<span className="text-[8px] font-normal text-gray-400 ml-0.5">°C</span></span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 pr-2">
               <button className="px-5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white transition-colors">
                 View Patient
               </button>
               <button className="px-5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors">
                 Dismiss
               </button>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="p-4 glass-panel border border-red-500/30 rounded-xl flex items-center justify-between group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-red-500"></div>
            
            <div className="flex items-center gap-6 pl-4 flex-1">
              <div className="flex flex-col items-center justify-center w-12 gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider font-mono">CRIT</span>
              </div>
              
              <div className="flex flex-col gap-1 min-w-[300px]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">Meena Iyer</span>
                  <span className="text-[10px] text-gray-400 font-mono">67y</span>
                  <span className="text-[10px] text-gray-500 font-mono ml-2">9 min ago</span>
                </div>
                <div className="text-[11px] text-red-400 font-bold">Hypertensive Crisis</div>
                <div className="text-[10px] text-gray-400">BP 210/120 with visual disturbances. Papilloedema suspected.</div>
              </div>

              {/* Vitals */}
              <div className="flex gap-4 ml-auto mr-8 items-center bg-black/40 rounded-lg p-2.5 border border-white/5">
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">HR</span>
                   <span className="text-xs font-black text-white">96<span className="text-[8px] font-normal text-gray-400 ml-0.5">bpm</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">SpO₂</span>
                   <span className="text-xs font-black text-white">97<span className="text-[8px] font-normal text-gray-400 ml-0.5">%</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">BP</span>
                   <span className="text-xs font-black text-red-500 animate-pulse">210/120</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">Temp</span>
                   <span className="text-xs font-black text-white">37.1<span className="text-[8px] font-normal text-gray-400 ml-0.5">°C</span></span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 pr-2">
               <button className="px-5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white transition-colors">
                 View Patient
               </button>
               <button className="px-5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors">
                 Dismiss
               </button>
            </div>
          </div>

          {/* Alert 3 */}
          <div className="p-4 glass-panel border border-amber-500/20 rounded-xl flex items-center justify-between group hover:bg-white/[0.02] transition-colors relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
            
            <div className="flex items-center gap-6 pl-4 flex-1">
              <div className="flex flex-col items-center justify-center w-12 gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider font-mono">WARN</span>
              </div>
              
              <div className="flex flex-col gap-1 min-w-[300px]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">Priya Sharma</span>
                  <span className="text-[10px] text-gray-400 font-mono">29y</span>
                  <span className="text-[10px] text-gray-500 font-mono ml-2">24 min ago</span>
                </div>
                <div className="text-[11px] text-amber-400 font-bold">Dengue Grade II — Falling Platelets</div>
                <div className="text-[10px] text-gray-400">Platelet count: 85,000. Haematocrit rising. Capillary leak risk.</div>
              </div>

              {/* Vitals */}
              <div className="flex gap-4 ml-auto mr-8 items-center bg-black/40 rounded-lg p-2.5 border border-white/5">
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">HR</span>
                   <span className="text-xs font-black text-white">98<span className="text-[8px] font-normal text-gray-400 ml-0.5">bpm</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">SpO₂</span>
                   <span className="text-xs font-black text-white">97<span className="text-[8px] font-normal text-gray-400 ml-0.5">%</span></span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">BP</span>
                   <span className="text-xs font-black text-amber-400">105/70</span>
                 </div>
                 <div className="w-px h-6 bg-white/10"></div>
                 <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                   <span className="text-[8px] text-gray-500 font-mono uppercase">Temp</span>
                   <span className="text-xs font-black text-amber-500">39.4<span className="text-[8px] font-normal text-amber-500/70 ml-0.5">°C</span></span>
                 </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 pr-2">
               <button className="px-5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white transition-colors">
                 View Patient
               </button>
               <button className="px-5 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors">
                 Dismiss
               </button>
            </div>
          </div>
          
        </div>
      </section>


      {/* ── BOTTOM GRID ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 pb-10">
        
        {/* Left Col: Schedule */}
        <div className="glass-panel border border-white/10 rounded-xl p-5 flex flex-col h-full">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
             <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-gray-400" />
               <h3 className="font-bold text-[12px] uppercase text-white tracking-wider">Today's Schedule</h3>
             </div>
             <span className="text-[10px] font-mono text-gray-500">5 total</span>
           </div>

           <div className="flex flex-col gap-5 flex-1 relative">
              {/* Vertical line connecting timeline */}
              <div className="absolute left-[39px] top-4 bottom-4 w-px bg-white/5"></div>

              {/* Appointment 1 */}
              <div className="flex items-start gap-4 relative z-10 opacity-50">
                 <div className="w-[50px] text-[10px] font-mono text-gray-400 font-bold mt-1 text-right">09:30</div>
                 <div className="w-5 h-5 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                 </div>
                 <div className="flex flex-col gap-0.5 pb-2">
                    <span className="text-xs font-bold text-white">Rajesh Khanna</span>
                    <span className="text-[10px] text-gray-500">ACS / Cardiology Follow-up</span>
                 </div>
              </div>

              {/* Appointment 2 (NOW) */}
              <div className="flex items-start gap-4 relative z-10">
                 <div className="w-[50px] text-[11px] font-mono text-cyan-400 font-black mt-1 text-right">10:30</div>
                 <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0 mt-0.5 z-10 ring-4 ring-cyan-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                 </div>
                 <div className="flex flex-col gap-1 pb-2 w-full pr-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-cyan-50">{activePatient.name}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[8px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div> NOW
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Active Patient Monitoring</span>
                 </div>
              </div>

              {/* Appointment 3 */}
              <div className="flex items-start gap-4 relative z-10">
                 <div className="w-[50px] text-[10px] font-mono text-gray-400 font-bold mt-1 text-right">11:00</div>
                 <div className="w-5 h-5 rounded-full bg-[#0a0a0a] border border-white/20 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <Circle className="w-2 h-2 text-gray-600" />
                 </div>
                 <div className="flex flex-col gap-0.5 pb-2">
                    <span className="text-xs font-bold text-white">Priya Sharma</span>
                    <span className="text-[10px] text-gray-500">Dengue Monitoring</span>
                 </div>
              </div>

              {/* Appointment 4 */}
              <div className="flex items-start gap-4 relative z-10">
                 <div className="w-[50px] text-[10px] font-mono text-gray-400 font-bold mt-1 text-right">12:15</div>
                 <div className="w-5 h-5 rounded-full bg-[#0a0a0a] border border-white/20 flex items-center justify-center shrink-0 mt-0.5 z-10">
                    <Circle className="w-2 h-2 text-gray-600" />
                 </div>
                 <div className="flex flex-col gap-0.5 pb-2">
                    <span className="text-xs font-bold text-white">Amit Patel</span>
                    <span className="text-[10px] text-gray-500">TB DOTS Sputum Check</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col: Vitals & AI */}
        <div className="flex flex-col gap-6">
           
           {/* Ward Vitals */}
           <div className="glass-panel border border-white/5 rounded-xl p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-[14px] text-white tracking-wide">Ward Vitals Overview</h3>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-gray-400 font-sans font-medium">Heart Rate</span>
                     <Heart className="w-4 h-4 text-rose-400" />
                   </div>
                   <div className="text-2xl font-black text-white">{activePatient.vitals.hr}<span className="text-[11px] font-medium text-gray-500 ml-1">bpm</span></div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-gray-400 font-sans font-medium">SpO₂</span>
                     <Wind className="w-4 h-4 text-cyan-400" />
                   </div>
                   <div className="text-2xl font-black text-white">{activePatient.vitals.spo2}<span className="text-[11px] font-medium text-gray-500 ml-1">%</span></div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-gray-400 font-sans font-medium">Temperature</span>
                     <Thermometer className="w-4 h-4 text-amber-400" />
                   </div>
                   <div className="text-2xl font-black text-white">{activePatient.vitals.temp}<span className="text-[11px] font-medium text-gray-500 ml-1">°C</span></div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] text-gray-400 font-sans font-medium">Blood Pressure</span>
                     <Activity className="w-4 h-4 text-purple-400" />
                   </div>
                   <div className="text-2xl font-black text-white tracking-tight">{activePatient.vitals.bp}</div>
                </div>
             </div>
           </div>

           {/* Recent AI Diagnoses */}
           <div className="glass-panel border border-white/10 rounded-xl p-5 flex-1 flex flex-col">
             <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
               <div className="flex items-center gap-2">
                 <Brain className="w-4 h-4 text-cyan-400" />
                 <h3 className="font-bold text-[12px] uppercase text-white tracking-wider flex items-center gap-2">
                   Recent AI Diagnoses <span className="text-[8px] bg-cyan-950/50 text-cyan-400 px-1.5 py-0.5 rounded font-mono border border-cyan-500/20">DEEPSEEK V3</span>
                 </h3>
               </div>
               <button className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
                 New Analysis &rarr;
               </button>
             </div>

             <div className="flex flex-col gap-3">
               <Link href="/view-anatomy" className="p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-cyan-500/30 rounded-lg flex items-center justify-between transition-colors group cursor-pointer">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Acute Coronary Syndrome (STEMI)</span>
                      <span className="text-[8px] bg-red-950/60 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Red Flag</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Mapped to: Heart, Left Ventricle, Aorta</span>
                 </div>
                 <div className="w-6 h-6 rounded bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Stethoscope className="w-3 h-3 text-cyan-400" />
                 </div>
               </Link>

               <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between opacity-60 pointer-events-none">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Bilateral Pneumonia</span>
                      <span className="text-[8px] bg-amber-950/60 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Review</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Mapped to: Left Lung, Right Lung, Bronchi</span>
                 </div>
               </div>
             </div>
           </div>

        </div>
      </section>

    </div>
  )
}
