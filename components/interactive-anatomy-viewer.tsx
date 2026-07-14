'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useSearchParams } from 'next/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useFBX, Html, Line, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle, RefreshCw, Layers,
  Mic, MicOff, Clock, User, Thermometer, FileText, ChevronDown, Zap,
  RotateCcw, RotateCw, ZoomIn, ZoomOut, ChevronUp, ChevronLeft, ChevronRight,
  Maximize2, Eye, Navigation, Crosshair, Move
} from 'lucide-react'

// ---------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------
export interface SystemToggles {
  skeletal: boolean
  muscular: boolean
  nervous: boolean
  cardiovascular: boolean
  respiratory: boolean
  digestive: boolean
  lymphatic: boolean
  integumentary: boolean
}

interface BodyOrgan {
  id: string
  name: string
  position: [number, number, number] // base local position centered at 0
}

export const ORGAN_SYSTEM_MAP: Record<string, keyof SystemToggles> = {
  'brain': 'nervous',
  'throat': 'respiratory',
  'nasal_cavity': 'respiratory',
  'trachea': 'respiratory',
  'lung_left': 'respiratory',
  'lung_right': 'respiratory',
  'heart': 'cardiovascular',
  'liver': 'digestive',
  'stomach': 'digestive',
  'kidney_left': 'digestive',
  'kidney_right': 'digestive',
  'intestines': 'digestive',
}

// Anatomically accurate organ positions (centered at 0,0,0 for target height 2.0)
export const ORGANS: BodyOrgan[] = [
  // Head & Neck
  { id: 'brain',        name: 'Brain',            position: [0,      2.35,  0.0]  },
  { id: 'nasal_cavity', name: 'Nasal Cavity',      position: [0,      2.12,  0.12] },
  { id: 'throat',       name: 'Throat/Larynx',     position: [0,      1.78,  0.04] },
  { id: 'trachea',      name: 'Trachea',           position: [0,      1.42,  0.02] },
  // Thoracic
  { id: 'lung_left',    name: 'Left Lung',         position: [-0.24,  1.0,   0.02] },
  { id: 'lung_right',   name: 'Right Lung',        position: [0.24,   1.0,   0.02] },
  { id: 'heart',        name: 'Heart',             position: [-0.08,  0.95,  0.08] },
  { id: 'aorta',        name: 'Aorta',             position: [0,      0.82,  0.05] },
  // Abdominal
  { id: 'liver',        name: 'Liver',             position: [0.20,   0.56,  0.06] },
  { id: 'stomach',      name: 'Stomach',           position: [-0.15,  0.50,  0.08] },
  { id: 'gallbladder',  name: 'Gallbladder',       position: [0.18,   0.43,  0.09] },
  { id: 'spleen',       name: 'Spleen',            position: [-0.28,  0.50, -0.04] },
  { id: 'pancreas',     name: 'Pancreas',          position: [-0.05,  0.44,  0.00] },
  // Retroperitoneal
  { id: 'kidney_left',  name: 'Left Kidney',       position: [-0.20,  0.42, -0.11] },
  { id: 'kidney_right', name: 'Right Kidney',      position: [0.20,   0.42, -0.11] },
  // Pelvic
  { id: 'intestines',   name: 'Intestines',        position: [0,      0.12,  0.04] },
  { id: 'appendix',     name: 'Appendix',          position: [0.22,   0.05,  0.06] },
  { id: 'bladder',      name: 'Urinary Bladder',   position: [0,     -0.10,  0.06] },
  // Nervous
  { id: 'spinal_cord',  name: 'Spinal Cord',       position: [0,      0.80, -0.10] },
  // Integumentary & Lymphatic
  { id: 'skin',         name: 'Skin/Integumentary',position: [0,      1.00,  0.18] },
  { id: 'lymph_nodes',  name: 'Lymph Nodes',       position: [0,      1.08,  0.06] },
  // Musculoskeletal
  { id: 'skeleton',     name: 'Skeletal System',   position: [0,     -0.80,  0.10] },
  { id: 'muscles',      name: 'Muscular System',   position: [0,     -0.80, -0.10] },
]

// Comprehensive synonym → canonical organ ID map
// Mirrors server-side ORGAN_SYNONYM_MAP exactly so every AI term resolves correctly
export const ORGAN_MAP: Record<string, string[]> = {
  // Heart & Vascular
  'heart': ['heart'], 'cardiac': ['heart'], 'myocardium': ['heart'],
  'pericardium': ['heart'], 'coronary': ['heart'], 'myocardial': ['heart'],
  'ventricle': ['heart'], 'atrium': ['heart'], 'valve': ['heart'],
  'pericardial': ['heart'],

  // Aorta
  'aorta': ['aorta', 'heart'], 'aortic': ['aorta', 'heart'],
  'vascular': ['heart', 'aorta'], 'cardiovascular': ['heart', 'aorta'],

  // Lungs — ALWAYS bilateral
  'lungs': ['lung_left', 'lung_right'], 'lung': ['lung_left', 'lung_right'],
  'lung_left': ['lung_left'], 'lung_right': ['lung_right'],
  'pulmonary': ['lung_left', 'lung_right'], 'bronchi': ['lung_left', 'lung_right'],
  'bronchial': ['lung_left', 'lung_right'], 'pleura': ['lung_left', 'lung_right'],
  'pleural': ['lung_left', 'lung_right'], 'diaphragm': ['lung_left', 'lung_right'],
  'respiratory': ['lung_left', 'lung_right', 'trachea'],
  'alveolar': ['lung_left', 'lung_right'],

  // Airways
  'trachea': ['trachea'], 'windpipe': ['trachea'], 'airway': ['trachea'],
  'throat': ['throat'], 'pharynx': ['throat'], 'larynx': ['throat'],
  'nasal_cavity': ['nasal_cavity'], 'nasal': ['nasal_cavity'],
  'sinuses': ['nasal_cavity'], 'sinus': ['nasal_cavity'], 'nose': ['nasal_cavity'],

  // Brain & Nervous
  'brain': ['brain'], 'cerebral': ['brain'], 'cerebrum': ['brain'],
  'cerebellum': ['brain'], 'meningeal': ['brain'], 'meninges': ['brain'],
  'cranial': ['brain'], 'neurological': ['brain'], 'intracranial': ['brain'],
  'brainstem': ['brain'], 'cortex': ['brain'],
  'spinal': ['spinal_cord'], 'spine': ['spinal_cord'], 'spinal_cord': ['spinal_cord'],

  // Liver
  'liver': ['liver', 'hepatic', 'organ'], 'hepatitis': ['liver', 'organ'],
  'biliary': ['liver', 'gallbladder', 'organ'], 'bile': ['liver', 'gallbladder', 'organ'],

  // Gallbladder
  'gallbladder': ['gallbladder', 'organ'], 'cholecyst': ['gallbladder', 'organ'], 'gall_bladder': ['gallbladder', 'organ'],

  // Kidneys — ALWAYS bilateral
  'kidneys': ['kidney_left', 'kidney_right', 'gland'], 'kidney': ['kidney_left', 'kidney_right', 'gland'],
  'kidney_left': ['kidney_left', 'gland'], 'kidney_right': ['kidney_right', 'gland'],
  'renal': ['kidney_left', 'kidney_right', 'gland'], 'nephro': ['kidney_left', 'kidney_right', 'gland'],
  'ureter': ['kidney_left', 'kidney_right', 'gland'],

  // Bladder & Urinary
  'bladder': ['bladder', 'gland'], 'urinary': ['kidney_left', 'kidney_right', 'bladder', 'gland'],
  'urethra': ['bladder', 'gland'], 'urological': ['kidney_left', 'kidney_right', 'bladder', 'gland'],

  // Stomach & GI
  'stomach': ['stomach', 'organ'], 'gastric': ['stomach', 'organ'], 'gastro': ['stomach', 'organ'],
  'esophagus': ['throat', 'stomach', 'organ'], 'oesophagus': ['throat', 'stomach', 'organ'],

  // Intestines
  'intestines': ['intestines', 'intestine'], 'intestinal': ['intestines', 'intestine'],
  'intestine': ['intestines', 'intestine'], 'bowel': ['intestines', 'intestine'], 'colon': ['intestines', 'intestine'],
  'colonic': ['intestines', 'intestine'], 'rectum': ['intestines', 'intestine'],
  'duodenum': ['stomach', 'intestines', 'organ', 'intestine'],
  'small_intestine': ['intestines', 'intestine'], 'large_intestine': ['intestines', 'intestine'],
  'ileum': ['intestines', 'intestine'], 'jejunum': ['intestines', 'intestine'], 'sigmoid': ['intestines', 'intestine'],

  // Appendix
  'appendix': ['appendix', 'intestine'], 'appendicitis': ['appendix', 'intestine'],

  // Pancreas
  'pancreas': ['pancreas', 'organ'], 'pancreatic': ['pancreas', 'organ'],
  'insulin': ['pancreas', 'organ'], 'diabetes': ['pancreas', 'organ'], 'diabetic': ['pancreas', 'organ'],

  // Spleen
  'spleen': ['spleen', 'organ'], 'splenic': ['spleen', 'organ'],

  // Skin
  'skin': ['skin'], 'integumentary': ['skin'], 'dermal': ['skin'],
  'dermatitis': ['skin'], 'rash': ['skin'], 'cutaneous': ['skin'],

  // Lymphatic
  'lymph': ['lymph_nodes'], 'lymphatic': ['lymph_nodes'],
  'lymph_nodes': ['lymph_nodes'], 'lymphoma': ['lymph_nodes'],
  'lymphadenopathy': ['lymph_nodes'],

  // Musculoskeletal
  'muscle': ['muscles'], 'muscles': ['muscles'], 'muscular': ['muscles'], 'myalgia': ['muscles'],
  'joint': ['muscles', 'skeleton'], 'bone': ['skeleton'], 'knee': ['skeleton'],
  'skeletal': ['skeleton'], 'arthritis': ['muscles', 'skeleton'],
}

// Vertical offset for exploded organ view in Split View mode
const getOrganVerticalOffset = (nodeName: string, materialNames: string[]): number => {
  const name = nodeName.toLowerCase()
  if (name.includes('brain') || name.includes('cerebr')) return 0.0
  if (name.includes('heart') || name.includes('atrium') || name.includes('ventricle')) return 0.3
  const isResp = materialNames.some(n => n.includes('lung') || n.includes('bronchi') || n.includes('trachea') || n.includes('cartilage'))
  if (isResp) return 0.3
  const isUrinary = materialNames.some(n => n.includes('organ.004') || n.includes('gland.004') || n.includes('kidney') || n.includes('bladder'))
  if (isUrinary) return -0.4
  const isDigestive = materialNames.some(n => n.includes('intestine') || n.includes('organ.003') || n.includes('esophagus') || n.includes('stomach') || n.includes('liver')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')
  if (isDigestive) {
    if (name.includes('intestine') || materialNames.some(n => n.includes('intestine'))) return -0.7
    return 0.0
  }
  return 0.0
}

// ---------------------------------------------------------
// Organ Detail Modal
// ---------------------------------------------------------
const ORGAN_ANATOMY: Record<string, { system: string; description: string; actions: string[] }> = {
  'Heart':             { system: 'Cardiovascular', description: 'A muscular organ that pumps blood through the circulatory system via rhythmic contractions. Located in the mediastinum, slightly left of the midline.', actions: ['Order 12-lead ECG', 'Troponin I & T assay', 'Cardiac echo referral', 'Cardiology consult'] },
  'Left Lung':         { system: 'Respiratory',    description: 'The left lung has two lobes and shares space with the heart. Responsible for gas exchange — oxygenating blood and expelling CO2.', actions: ['Chest X-ray / CT', 'Sputum culture & AFB', 'Spirometry / PFT', 'Pulmonology referral'] },
  'Right Lung':        { system: 'Respiratory',    description: 'The right lung has three lobes and is slightly larger than the left. Critical for oxygen delivery via alveolar diffusion.', actions: ['Chest X-ray / CT', 'Sputum culture & AFB', 'Spirometry / PFT', 'Pulmonology referral'] },
  'Brain':             { system: 'Nervous',        description: 'The central command organ of the nervous system. Controls cognition, motor function, autonomic regulation, and sensory processing.', actions: ['Non-contrast CT head', 'MRI brain with contrast', 'LP for CSF analysis', 'Neurology consult'] },
  'Liver':             { system: 'Digestive',      description: 'The largest solid organ in the abdomen. Responsible for detoxification, protein synthesis, bile production, and glycogen storage.', actions: ['LFT panel (ALT/AST/ALP)', 'Hepatitis serology', 'Abdominal USG', 'Gastroenterology referral'] },
  'Stomach':           { system: 'Digestive',      description: 'A muscular, J-shaped organ that churns food and mixes it with gastric acid for digestion. Located in the left upper quadrant.', actions: ['Upper GI endoscopy', 'H. pylori testing', 'Barium swallow', 'GI specialist referral'] },
  'Intestines':        { system: 'Digestive',      description: 'Includes the small intestine (nutrient absorption) and large intestine (water reabsorption and waste formation). Total length ~7-9 metres.', actions: ['Abdominal X-ray', 'CT abdomen & pelvis', 'Stool culture / FOBT', 'Colonoscopy referral'] },
  'Left Kidney':       { system: 'Urinary',        description: 'Bean-shaped retroperitoneal organ that filters blood daily, excretes waste as urine, and regulates fluid and electrolyte balance.', actions: ['Serum creatinine & BUN', 'Urine R/E & culture', 'Renal USG', 'Nephrology consult'] },
  'Right Kidney':      { system: 'Urinary',        description: 'Filters blood to produce urine, regulates blood pressure via renin secretion, and produces erythropoietin. Sits slightly lower than the left.', actions: ['Serum creatinine & BUN', 'Urine R/E & culture', 'Renal USG', 'Nephrology consult'] },
  'Aorta':             { system: 'Cardiovascular', description: 'The largest artery in the body. Carries oxygenated blood from the left ventricle to distribute throughout the systemic circulation.', actions: ['CT aortogram', 'Doppler USG aorta', 'Vascular surgery consult', 'BP control protocol'] },
  'Throat/Larynx':     { system: 'Respiratory',   description: 'The larynx houses the vocal cords and routes air to the trachea. The pharynx connects the nasal/oral cavity to the oesophagus and trachea.', actions: ['ENT laryngoscopy', 'Throat swab culture', 'Neck CT scan', 'ENT specialist referral'] },
  'Trachea':           { system: 'Respiratory',   description: 'A cartilaginous tube connecting the larynx to the bronchi. It is the primary airway conduit for breathing.', actions: ['Chest X-ray', 'CT thorax', 'Bronchoscopy', 'Pulmonology referral'] },
  'Nasal Cavity':      { system: 'Respiratory',   description: 'Filters, warms, and humidifies inhaled air. Houses olfactory receptors. Communicates with the paranasal sinuses.', actions: ['Nasal endoscopy', 'Sinus CT scan', 'Allergy panel', 'ENT referral'] },
  'Gallbladder':       { system: 'Digestive',     description: 'A pear-shaped sac beneath the liver that stores and concentrates bile produced by the liver for fat digestion.', actions: ['Abdominal USG', 'LFT panel', 'HIDA scan', 'Surgical consult for cholecystitis'] },
  'Pancreas':          { system: 'Digestive',     description: 'Dual-function gland: exocrine (digestive enzymes) and endocrine (insulin, glucagon from islets of Langerhans).', actions: ['Serum amylase & lipase', 'Blood glucose / HbA1c', 'CT abdomen pancreatic protocol', 'Endocrinology consult'] },
  'Spleen':            { system: 'Lymphatic',     description: 'Filters blood, recycles old red blood cells, and houses lymphocytes for immune surveillance. Located in the left upper quadrant.', actions: ['CBC with differential', 'Abdominal USG', 'CT abdomen', 'Haematology referral'] },
  'Appendix':          { system: 'Digestive',     description: 'A small finger-shaped tube attached to the caecum. Its rupture causes peritonitis — a surgical emergency.', actions: ['CT abdomen & pelvis', 'Surgical consult urgently', 'Serial abdominal exams', 'Pre-op labs & crossmatch'] },
  'Urinary Bladder':   { system: 'Urinary',       description: 'A muscular sac in the pelvis that stores urine produced by the kidneys until voluntary voiding via the urethra.', actions: ['Urine R/E & culture', 'Cystoscopy', 'Bladder USG', 'Urology referral'] },
  'Spinal Cord':       { system: 'Nervous',       description: 'The main conduit for signals between the brain and the body. Housed within the vertebral column; injury can cause paralysis.', actions: ['MRI spine with contrast', 'Neurological exam', 'Neurosurgery consult', 'Steroid protocol if SCI'] },
  'Skin/Integumentary':{ system: 'Integumentary', description: 'The body largest organ. Acts as a barrier against infection, regulates temperature, and provides sensory perception.', actions: ['Skin biopsy / swab', 'Wound culture', 'Dermatology referral', 'Wound care protocol'] },
  'Lymph Nodes':       { system: 'Lymphatic',     description: 'Small glands throughout the body that filter lymph fluid and mount immune responses. Enlargement signals infection or malignancy.', actions: ['CBC with differential', 'LDH & uric acid', 'CT chest/abdomen/pelvis', 'Haematology referral'] },
  'Skeletal System':   { system: 'Skeletal',      description: 'The structural framework of the body consisting of bones and joints. Provides support, protection, and facilitates movement.', actions: ['X-Ray affected area', 'CT scan for complex fractures', 'Orthopedics consult', 'Immobilisation if indicated'] },
  'Muscular System':   { system: 'Muscular',      description: 'The network of skeletal muscles that enables movement, maintains posture, and circulates blood throughout the body.', actions: ['MRI for soft tissue/ligaments', 'CK level assessment', 'Physiotherapy evaluation', 'Rest, Ice, Compression, Elevation'] },
}

function OrganDetailModal({ organ, condition, reasoning, severity, onClose }: {
  organ: string
  condition?: string
  reasoning?: string
  severity?: string
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const info = ORGAN_ANATOMY[organ]
  const severityColor =
    severity?.toUpperCase() === 'CRITICAL' ? 'text-red-400 bg-red-950/40 border-red-500/40' :
    severity?.toUpperCase() === 'HIGH'     ? 'text-orange-400 bg-orange-950/40 border-orange-500/40' :
    severity?.toUpperCase() === 'MEDIUM'   ? 'text-amber-400 bg-amber-950/40 border-amber-500/40' :
                                             'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,5,20,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[520px] max-w-[95vw] bg-[#0b132b] border border-cyan-500/20 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.12)] overflow-hidden font-mono"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-on-surface-variant uppercase tracking-[0.18em] font-bold">Clinical Detail View</span>
            <h2 className="text-lg font-black text-white uppercase tracking-widest leading-tight">{organ}</h2>
            {info && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{info.system} System</span>}
          </div>
          <div className="flex items-center gap-3">
            {severity && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${severityColor}`}>
                {severity}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer text-sm font-bold"
            >
              X
            </button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-5">
          {condition && (
            <div className="flex flex-col gap-1">
              <span className="text-[8.5px] text-on-surface-variant uppercase tracking-[0.15em] font-bold">Suspected Condition</span>
              <div className="text-[13px] font-black text-red-400 uppercase tracking-wide">{condition}</div>
            </div>
          )}
          {reasoning && (
            <div className="p-4 bg-black/50 border border-slate-800/80 rounded-xl space-y-1.5">
              <span className="text-[8.5px] text-on-surface-variant uppercase tracking-[0.15em] font-bold block">AI Clinical Reasoning</span>
              <p className="text-[11.5px] text-slate-200 leading-relaxed font-sans font-medium">{reasoning}</p>
            </div>
          )}
          {info && (
            <div className="p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-xl space-y-1.5">
              <span className="text-[8.5px] text-primary/70 uppercase tracking-[0.15em] font-bold block">Anatomical Overview</span>
              <p className="text-[11px] text-on-surface leading-relaxed font-sans">{info.description}</p>
            </div>
          )}
          {info && (
            <div className="space-y-2">
              <span className="text-[8.5px] text-on-surface-variant uppercase tracking-[0.15em] font-bold block">Recommended Clinical Actions</span>
              <div className="grid grid-cols-2 gap-2">
                {info.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-blue-950/50 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="text-[10px] text-on-surface font-sans font-medium">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-sans">AI decision support — requires physician verification</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 text-primary text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// Smoothly Animated Callout Card (Syncs with organ positions)
// ---------------------------------------------------------
// ─────────────────────────────────────────────────────────────────────────────
// SmartCallout — compact pill label system
// Marker dot sits exactly on the organ; pill label pushed to left/right column
// A thin connector line links them. Labels are intentionally small & compact.
// ─────────────────────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  CRITICAL: { bg: '#1a0505', text: '#f87171', border: '#7f1d1d', dot: '#ef4444' },
  HIGH:     { bg: '#1a0a03', text: '#fb923c', border: '#7c2d12', dot: '#f97316' },
  MEDIUM:   { bg: '#1a1503', text: '#fbbf24', border: '#78350f', dot: '#f59e0b' },
  LOW:      { bg: '#031a0d', text: '#34d399', border: '#064e3b', dot: '#10b981' },
}
function getSev(s?: string) {
  const k = (s || 'LOW').toUpperCase() as keyof typeof SEVERITY_COLOR
  return SEVERITY_COLOR[k] ?? SEVERITY_COLOR.LOW
}

function SmartCallout({
  markerPosition, labelX, labelY,
  organName, condition, reasoning, severity,
  isSplittedRef, verticalOffset, onOrganClick,
}: {
  markerPosition: [number, number, number]
  labelX: number
  labelY: number
  organName: string
  condition?: string
  reasoning?: string
  severity?: string
  isSplittedRef: React.MutableRefObject<boolean>
  verticalOffset: number
  onOrganClick?: (organ: string, condition?: string, reasoning?: string, severity?: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { invalidate } = useThree()
  const sev = getSev(severity)

  useFrame(() => {
    if (!groupRef.current) return
    const targetY = isSplittedRef.current ? markerPosition[1] + verticalOffset : markerPosition[1]
    if (Math.abs(groupRef.current.position.y - targetY) > 0.001) {
      groupRef.current.position.y = targetY
      invalidate()
    }
  })

  const localDot:   [number, number, number] = [markerPosition[0], 0, markerPosition[2]]
  const localLabel: [number, number, number] = [labelX, labelY - markerPosition[1], 0.06]
  const isLeft = labelX < 0

  // Mid-elbow point for curved connector
  const midX = markerPosition[0] + (labelX - markerPosition[0]) * 0.45
  const midY = (labelY - markerPosition[1]) * 0.5
  const midPt: [number, number, number] = [midX, midY, 0.03]

  return (
    <group ref={groupRef} position={[0, markerPosition[1], 0]}>
      {/* Pulsing dot — sits ON the organ */}
      <mesh position={localDot}>
        <sphereGeometry args={[0.030, 12, 12]} />
        <meshStandardMaterial
          color={sev.dot} emissive={sev.dot} emissiveIntensity={3.2}
          transparent opacity={0.98} depthWrite={false}
        />
      </mesh>

      {/* Thin connector line: dot → elbow → label */}
      <Line
        points={[localDot, midPt, localLabel]}
        color={sev.dot}
        lineWidth={0.6}
      />

      {/* Compact pill label — rendered in HTML overlay */}
      <Html
        position={localLabel}
        distanceFactor={6}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          style={{
            transform: isLeft ? 'translateX(-100%)' : 'translateX(0)',
            background: sev.bg,
            border: `1px solid ${sev.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            userSelect: 'none' as const,
            backdropFilter: 'blur(6px)',
            minWidth: '120px',
            maxWidth: '168px',
            fontFamily: 'monospace',
          }}
          onClick={onOrganClick ? () => onOrganClick(organName, condition, reasoning, severity) : undefined}
        >
          {/* Top row: organ name + severity chip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '6px', padding: '5px 7px 3px',
            borderBottom: `1px solid ${sev.border}44`,
          }}>
            <span style={{
              fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#e2e8f0', lineHeight: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100px',
            }}>
              {organName}
            </span>
            {severity && (
              <span style={{
                fontSize: '7px', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: sev.text,
                padding: '1px 4px', borderRadius: '3px',
                border: `1px solid ${sev.border}`,
                background: `${sev.dot}18`,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {severity.slice(0, 4)}
              </span>
            )}
          </div>
          {/* Condition line */}
          {condition && (
            <div style={{
              padding: '3px 7px 2px',
              fontSize: '8px', color: sev.text, fontWeight: 700,
              lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
            }}>
              {condition.length > 42 ? condition.slice(0, 42) + '…' : condition}
            </div>
          )}
          {/* Click hint */}
          <div style={{
            padding: '2px 7px 4px',
            fontSize: '7px', color: '#475569',
            fontFamily: 'monospace',
          }}>
            ↗ tap for details
          </div>
        </div>
      </Html>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-column organ scope — defines which organ IDs are anatomically visible
// in each GLTF model column.  null = show ALL affected organs.
// ─────────────────────────────────────────────────────────────────────────────
//
// Column -2.4 → splanchnology skin column: only skin & lymph structures
// Column -1.2 → splanchnology organs column: ALL organs (null = every affected organ)
// Column  1.2 → scene.gltf cardiovascular: heart, aorta, lungs (vessel-bearing organs)
// Column  2.4 → myology.glb muscular: skin/lymph if affected, else nothing
const COLUMN_SCOPE: Record<string, string[] | null> = {
  '-2.4': ['skin', 'lymph_nodes'],
  '-1.2': null,  // null = all affected organs
  // Cardiovascular column: vessels supply ALL organs, so show any affected organ
  // that has vascular relevance (heart, aorta, lungs + any organ with blood supply)
  '1.2':  ['heart', 'aorta', 'lung_left', 'lung_right', 'kidney_left', 'kidney_right', 'liver', 'spleen'],
  '2.4':  ['skin', 'lymph_nodes'],
}

// Label horizontal offsets per column:
// Organs column gets the full ±0.92 spread; flanking columns use ±0.58
// to avoid labels running off-screen in split-view.
const COLUMN_LX: Record<string, [number, number]> = {
  '-2.4': [-0.58,  0.58],
  '-1.2': [-0.92,  0.92],
  '1.2':  [-0.58,  0.58],
  '2.4':  [-0.58,  0.58],
}

// Non-overlapping callout layout — assigns left/right columns, enforces MIN_GAP
// leftX / rightX let each model column use its own horizontal offsets.
function computeCalloutLayout(
  affectedOrganIds: string[],
  leftX = -0.92,
  rightX = 0.92,
): Array<{ organ: BodyOrgan; labelX: number; labelY: number }> {
  if (affectedOrganIds.length === 0) return []

  const MIN_GAP = 0.22   // compact pills need only 0.22 gap

  const active = ORGANS.filter(o => affectedOrganIds.includes(o.id))

  const leftPool:  BodyOrgan[] = []
  const rightPool: BodyOrgan[] = []
  const centerOrg: BodyOrgan[] = []

  active.forEach(o => {
    if      (o.position[0] < -0.06) leftPool.push(o)
    else if (o.position[0] >  0.06) rightPool.push(o)
    else    centerOrg.push(o)
  })
  centerOrg.forEach((o) => {
    if (leftPool.length <= rightPool.length) leftPool.push(o)
    else rightPool.push(o)
  })

  leftPool.sort ((a, b) => b.position[1] - a.position[1])
  rightPool.sort((a, b) => b.position[1] - a.position[1])

  function spread(pool: BodyOrgan[], x: number) {
    const out: { organ: BodyOrgan; labelX: number; labelY: number }[] = []
    let prevY = Infinity
    for (const o of pool) {
      let y = Math.min(o.position[1], prevY - MIN_GAP)
      y = Math.max(-1.0, Math.min(2.5, y))
      out.push({ organ: o, labelX: x, labelY: y })
      prevY = y
    }
    return out
  }

  return [...spread(leftPool, leftX), ...spread(rightPool, rightX)]
}

// ─────────────────────────────────────────────────────────────────────────────
// CameraController — lives INSIDE the Canvas, exposes camera control methods
// to the page via forwardRef / useImperativeHandle.
// It internally renders OrbitControls so rotation limits are always respected.
// ─────────────────────────────────────────────────────────────────────────────
export interface CameraHandle {
  rotateLeft:  () => void
  rotateRight: () => void
  tiltUp:      () => void
  tiltDown:    () => void
  zoomIn:      () => void
  zoomOut:     () => void
  reset:       () => void
  frontView:   () => void
  sideView:    () => void
  topView:     () => void
}

const CameraController = forwardRef<CameraHandle>(function CameraController(_, ref) {
  const orbitRef = useRef<any>(null)
  const { invalidate } = useThree()

  // Spherical rotation helper — moves camera around target by angle deltas
  const rotate = useCallback((deltaTheta: number, deltaPhi: number) => {
    const ctrl = orbitRef.current
    if (!ctrl) return
    const cam = ctrl.object as THREE.PerspectiveCamera
    const tgt = ctrl.target.clone() as THREE.Vector3
    const pos = cam.position.clone().sub(tgt)
    const sph = new THREE.Spherical().setFromVector3(pos)
    sph.theta += deltaTheta
    sph.phi   = Math.max(Math.PI / 6, Math.min((Math.PI * 5) / 6, sph.phi + deltaPhi))
    pos.setFromSpherical(sph)
    cam.position.copy(pos.add(tgt))
    cam.lookAt(tgt)
    ctrl.update()
    invalidate()
  }, [invalidate])

  // Distance zoom helper
  const zoom = useCallback((factor: number) => {
    const ctrl = orbitRef.current
    if (!ctrl) return
    const cam = ctrl.object as THREE.PerspectiveCamera
    const tgt = ctrl.target.clone() as THREE.Vector3
    const dir = cam.position.clone().sub(tgt)
    const newDist = Math.max(1.0, Math.min(8.0, dir.length() * factor))
    dir.normalize().multiplyScalar(newDist)
    cam.position.copy(dir.add(tgt))
    ctrl.update()
    invalidate()
  }, [invalidate])

  // Absolute position jump helper
  const moveTo = useCallback((px: number, py: number, pz: number) => {
    const ctrl = orbitRef.current
    if (!ctrl) return
    ctrl.object.position.set(px, py, pz)
    ctrl.object.lookAt(0, 0, 0)
    ctrl.update()
    invalidate()
  }, [invalidate])

  useImperativeHandle(ref, () => ({
    rotateLeft:  () => rotate(-Math.PI / 12, 0),
    rotateRight: () => rotate( Math.PI / 12, 0),
    tiltUp:      () => rotate(0, -Math.PI / 12),
    tiltDown:    () => rotate(0,  Math.PI / 12),
    zoomIn:      () => zoom(0.80),
    zoomOut:     () => zoom(1.25),
    reset:       () => moveTo(0, 0.2, 4.6),
    frontView:   () => moveTo(0, 0.2, 4.6),
    sideView:    () => moveTo(4.4, 0.2, 0.2),
    topView:     () => moveTo(0, 5.0, 0.2),
  }), [rotate, zoom, moveTo])

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enablePan={true}
      rotateSpeed={2.5}
      zoomSpeed={1.5}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 1.3}
      minDistance={1.0}
      maxDistance={8}
      target={[0, 0, 0]}
      onChange={() => invalidateFnRef.current()}
    />
  )
})

// Bridge that stores R3F invalidate() outside Canvas scope
export const invalidateFnRef = { current: (() => {}) as () => void }
function InvalidateBridge() {
  const { invalidate } = useThree()
  useEffect(() => { invalidateFnRef.current = invalidate }, [invalidate])
  return null
}

// Preload all models at module level so the browser fetches them immediately
// on page load rather than waiting for the Suspense boundary to mount
if (typeof window !== 'undefined') {
  useGLTF.preload('/ai-in-healthcare/asset-01/splanchnology.glb')
  useGLTF.preload('/ai-in-healthcare/asset-01/scene-v1 (1).glb')
  useGLTF.preload('/ai-in-healthcare/asset-01/myology-v1.glb')
  useGLTF.preload('/ai-in-healthcare/asset-01/free_pack_-_human_skeleton.glb')
  useGLTF.preload('/ai-in-healthcare/asset-01/joe__realistic_human_3d_model.glb')
}

// ---------------------------------------------------------
// ActiveTransformTarget: Draggable 3D gizmo helper
// ---------------------------------------------------------
const ActiveTransformTarget = React.memo(function ActiveTransformTarget({ 
  organId, baseX, baseY, baseZ, offset, onAdjust 
}: { 
  organId: string; baseX: number; baseY: number; baseZ: number; 
  offset: { x: number, y: number, z: number }; 
  onAdjust: (organ: string, x: number, y: number, z: number) => void 
}) {
  const ref = useRef<THREE.Group>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.position.set(offset.x, offset.y, offset.z)
    }
  }, [offset.x, offset.y, offset.z])

  return (
    <group position={[baseX, baseY, baseZ]}>
      <group ref={ref}>
        {/* Glowing red drag target dot */}
        <mesh>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ef4444" depthTest={false} />
        </mesh>
      </group>
      <TransformControls 
        object={ref} 
        mode="translate"
        size={0.65}
        onObjectChange={() => {
          if (ref.current) {
            const { x, y, z } = ref.current.position
            onAdjust(organId, x, y, z)
          }
        }}
      />
    </group>
  )
})

// ---------------------------------------------------------
// GLTF Model Component (Preserves Embedded Textures/Colors)
// ---------------------------------------------------------
const RealisticGLTFModel = React.memo(function RealisticGLTFModel({
  path, positionX, splitPositionX, activeSystems, highlightedMeshNames, viewMode, visible, isSplittedRef, affectedOrganIds, conditionsByOrgan, onModelClick, onOrganClick, labelOffsets, activeAdjustOrgan, onAdjustLabel, renderOrder
}: {
  path: string; positionX: number; splitPositionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]; viewMode: 'split' | 'single'; visible: boolean; isSplittedRef: React.MutableRefObject<boolean>; affectedOrganIds: string[]; conditionsByOrgan: any; onModelClick: () => void; onOrganClick?: (organ: string, condition?: string, reasoning?: string, severity?: string) => void; labelOffsets?: Record<string, { x: number, y: number, z: number }>; activeAdjustOrgan?: string | null; onAdjustLabel?: (organ: string, x: number, y: number, z: number) => void; renderOrder?: number
}) {
  const { scene } = useGLTF(path)
  const { scene: skeletonScene } = useGLTF('/ai-in-healthcare/asset-01/free_pack_-_human_skeleton.glb')
  const groupRef = useRef<THREE.Group>(null)

  const masterParams = useMemo(() => {
    const clone = SkeletonUtils.clone(skeletonScene)
    const sketchfabModel = clone.getObjectByName('Sketchfab_model')
    if (sketchfabModel) sketchfabModel.rotation.set(-Math.PI / 2, 0, 0)
    else clone.rotation.x = -Math.PI / 2
    
    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        if (name.includes('floor') || name.includes('ground') || name.includes('plane') || name.includes('grid') || name.includes('helper')) return
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
          const meshBox = child.geometry.boundingBox!.clone().applyMatrix4(child.matrixWorld)
          if (!hasMesh) { box.copy(meshBox); hasMesh = true } else box.union(meshBox)
        }
      }
    })
    if (!hasMesh) box.setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scaleFactor = 2.0 / (size.y || 1)
    return {
      scaleFactor,
      centerX: center.x,
      centerY: center.y,
      centerZ: center.z,
      minY: box.min.y
    }
  }, [skeletonScene])

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)

    // Apply model-specific root rotations BEFORE bounding box computation
    if (path.includes('myology') || path.includes('scene') || path.includes('joe')) {
      const sketchfabModel = clone.getObjectByName('Sketchfab_model')
      if (sketchfabModel) sketchfabModel.rotation.set(-Math.PI / 2, 0, 0)
      else if (path.includes('joe') || (!path.includes('-v1') && !path.includes('scene-v1'))) {
        clone.rotation.x = -Math.PI / 2
      }
    }

    // Align all models to the skeleton (master reference) parameters
    clone.scale.setScalar(masterParams.scaleFactor)
    clone.position.set(
      -masterParams.centerX * masterParams.scaleFactor,
      -masterParams.minY * masterParams.scaleFactor - 1.0,
      -masterParams.centerZ * masterParams.scaleFactor
    )

    // ────────────────────────────────────────────────────────────
    // STEP 2: NOW remove unwanted meshes per column (after bbox)
    // ────────────────────────────────────────────────────────────
    if (path.includes('splanchnology')) {
      if (splitPositionX === -1.2) {
        // Organs column: remove skin, bones, skull – keep all organs including brain
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material]
            const matNames = mats.map((m: any) => m ? (m.name || '').toLowerCase() : '')
            const name = child.name.toLowerCase()
            const isSkin = matNames.some(n => n.includes('skin')) || name.includes('skin')
            const isBone = matNames.some(n => n.includes('bone') || n.includes('skull')) || name.includes('bone') || name.includes('skull')
            if (isSkin || isBone) toRemove.push(child)
          }
        })
        toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
      } else if (splitPositionX === -2.4) {
        // Skin column: remove everything except skin meshes
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material]
            const matNames = mats.map((m: any) => m ? (m.name || '').toLowerCase() : '')
            const name = child.name.toLowerCase()
            const isSkin = matNames.some(n => n.includes('skin')) || name.includes('skin') || name.includes('integumentary') || name.includes('body')
            if (!isSkin) toRemove.push(child)
          }
        })
        toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
      }
    } else if (path.includes('skeleton')) {
      const toRemove: THREE.Object3D[] = []
      clone.traverse((child) => {
        const name = child.name.toLowerCase()
        if (name.includes('outline')) toRemove.push(child)
      })
      toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
    }

    // ────────────────────────────────────────────────────────────
    // STEP 3: Compute organ explosion vertical offsets for split view
    //         NO brain offset needed – it is already at the correct
    //         position inside the skull because the bounding box was
    //         computed from the full body.
    // ────────────────────────────────────────────────────────────
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const mesh = child as THREE.Mesh
      const name = mesh.name.toLowerCase()
      const parentName = mesh.parent ? mesh.parent.name.toLowerCase() : ''
      const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')

      const isColumn2Organ = splitPositionX === -1.2 && path.includes('splanchnology')
      if (isColumn2Organ) {
        const isBrain = name.includes('brain') || name.includes('cerebr') || parentName.includes('brain') || parentName.includes('cerebr')
        if (!isBrain) {
          const offset = getOrganVerticalOffset(name, matNames)
          if (offset !== 0) {
            mesh.userData.originalY = mesh.userData.originalY ?? mesh.position.y
            mesh.userData.offsetY = offset / masterParams.scaleFactor
          }
        }
      }
    })

    // ── STEP 4: Pre-tag every mesh with cached metadata for zero-cost updates ──
    // Build typed arrays instead of traversing on every render
    type MeshEntry = {
      mesh: THREE.Mesh
      name: string
      isSkin: boolean
      isBrain: boolean
      isHeart: boolean
      isRespiratory: boolean
      isDigestive: boolean
      isVessel: boolean
      mats: THREE.Material[]
    }
    const meshList: MeshEntry[] = []

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const name = child.name.toLowerCase()
      const mats: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material]
      const matNames = mats.map((m: any) => m ? (m.name || '').toLowerCase() : '')

      // One-time material setup
      if (!child.userData._matSetup) {
        const isSkinMat = !path.includes('joe') && (
          name.includes('skin') || name.includes('body') || name.includes('short') ||
          name.includes('eye') || name.includes('head') || name.includes('hair')
        )
        mats.forEach((m: any) => {
          if (!m) return
          if (isSkinMat) { m.transparent = true; m.opacity = 0.18; m.depthWrite = false }
          else { m.transparent = false; m.opacity = 1.0 }

          // Enhance vessels visibility (scene.gltf)
          if (path.includes('scene') && m.name) {
            const matName = m.name.toLowerCase()
            if (matName.includes('artery')) {
              m.color.set('#ff2b36') // Vibrant crimson red
              m.roughness = 0.2
              m.metalness = 0.2
              if (m.emissive) {
                m.emissive.set('#5e0004') // Subtle glow base
                m.emissiveIntensity = 0.6
              }
            } else if (matName.includes('vein')) {
              m.color.set('#2b7fff') // Vibrant cobalt blue
              m.roughness = 0.2
              m.metalness = 0.2
              if (m.emissive) {
                m.emissive.set('#00185e') // Subtle glow base
                m.emissiveIntensity = 0.6
              }
            }
          }
        })
        child.userData._matSetup = true
      }

      meshList.push({
        mesh: child,
        name,
        isSkin: name.includes('skin') || name.includes('integumentary') || name.includes('body') ||
          name.includes('short') || name.includes('eye') || name.includes('head') ||
          name.includes('lash') || name.includes('nail') || name.includes('hair'),
        isBrain: name.includes('brain') || name.includes('cerebr'),
        isHeart: name.includes('heart') || name.includes('atrium') || name.includes('ventricle'),
        isRespiratory: matNames.some(n => n.includes('lung') || n.includes('bronchi') || n.includes('trachea')) ||
          name.includes('trachea'),
        isDigestive: matNames.some(n => n.includes('intestine') || n.includes('stomach') ||
          n.includes('liver') || n.includes('kidney') || n.includes('organ')) ||
          name.includes('stomach') || name.includes('liver') || name.includes('intestine') ||
          name.includes('kidney') || name.includes('spleen') || name.includes('pancrea') ||
          name.includes('gallbladder') || name.includes('bladder') || name.includes('appendix'),
        isVessel: matNames.some(n => n.includes('artery') || n.includes('vein')),
        mats,
      })
    })
    clone.updateMatrixWorld(true) // Fix: Update matrix world after scale/position so annotations get correct world coords
    clone.userData._meshList = meshList

    return clone
  }, [scene, splitPositionX, path])

  // ── Cached mesh list and animated organs — built once from clone ──────────
  const meshList = useMemo(
    () => (cloned.userData._meshList as ReturnType<typeof buildMeshList>) ?? [],
    [cloned]
  )

  const animatedMeshes = useMemo(() => {
    if (splitPositionX !== -1.2 || !path.includes('splanchnology')) return []
    const out: { mesh: THREE.Object3D; originalY: number; offsetY: number }[] = []
    cloned.traverse((c) => {
      if (c.userData.offsetY !== undefined)
        out.push({ mesh: c, originalY: c.userData.originalY ?? c.position.y, offsetY: c.userData.offsetY })
    })
    return out
  }, [cloned, splitPositionX, path])


  // ── Compute Annotation Labels ────────────────────────────────────────────────
  const annotations = useMemo(() => {
    if (!conditionsByOrgan || Object.keys(conditionsByOrgan).length === 0) return []
    
    const out: { organ: string, condition: string, severity: string, x: number, y: number, z: number, mesh: THREE.Object3D }[] = []
    const seenOrgans = new Set<string>()

    cloned.traverse((c: any) => {
      if (!(c instanceof THREE.Mesh)) return
      
      const name = c.name.toLowerCase()
      const matNames = Array.isArray(c.material) ? c.material.map((m: any) => m?.name?.toLowerCase() || '') : [c.material?.name?.toLowerCase() || '']
      let organId = null
      
      for (const org of affectedOrganIds) {
        const query = org.replace('_', '')
        const querySplit = org.split('_')[0]
        
        if (
           name.includes(query) || name.includes(querySplit) ||
           matNames.some(n => n.includes(query) || n.includes(querySplit))
        ) {
           organId = org
           break
        }
      }
      
      if (organId && conditionsByOrgan[organId] && !seenOrgans.has(organId)) {
         seenOrgans.add(organId)
         
         if (!c.geometry.boundingBox) c.geometry.computeBoundingBox()
         const center = new THREE.Vector3()
         c.geometry.boundingBox.getCenter(center)
         
         // Compute center relative to the cloned group, not world, to prevent double-shifting
         // Since c might be nested, we use matrixWorld but inverse-transform by the root clone
         const worldCenter = center.clone().applyMatrix4(c.matrixWorld)
         const localCenter = cloned.worldToLocal(worldCenter)
         
         const offset = labelOffsets?.[organId] || { x: 0, y: 0, z: 0 }
         out.push({
           organ: organId,
           condition: conditionsByOrgan[organId].condition,
           severity: conditionsByOrgan[organId].severity || 'Medium',
           baseX: localCenter.x,
           baseY: localCenter.y,
           baseZ: localCenter.z,
           x: localCenter.x + offset.x,
           y: localCenter.y + offset.y,
           z: localCenter.z + offset.z,
           mesh: c,
           reasoning: conditionsByOrgan[organId].reasoning || ''
         })
      }
    })
    return out
  }, [cloned, affectedOrganIds, conditionsByOrgan, labelOffsets])

  const { invalidate } = useThree()

  // ── Frame loop: only position arithmetic, no traversal ───────────────────
  useFrame(() => {
    if (groupRef.current) {
      const targetX = (viewMode === 'split' && isSplittedRef.current) ? positionX : 0.0
      const dx = groupRef.current.position.x - targetX
      if (Math.abs(dx) > 0.001) {
        groupRef.current.position.x += dx * -0.35
        invalidate()
      }
    }
    if (animatedMeshes.length > 0) {
      const splitting = viewMode === 'split' && isSplittedRef.current
      for (let i = 0; i < animatedMeshes.length; i++) {
        const { mesh, originalY, offsetY } = animatedMeshes[i]
        const ty = splitting ? originalY + offsetY : originalY
        if (Math.abs(mesh.position.y - ty) > 0.0005) { mesh.position.y = ty; invalidate() }
      }
    }
  })

  // ── Visibility + highlight — iterate cached array, no traverse() ─────────
  useEffect(() => {
    const isSplanchnology = path.includes('splanchnology')
    const isScene = path.includes('scene')
    const isMyology = path.includes('myology')
    const isSkeletonGLB = path.includes('skeleton')
    const isJoe = path.includes('joe')
    const isSkinCol = splitPositionX === -2.4
    const isOrganCol = splitPositionX === -1.2

    for (let i = 0; i < meshList.length; i++) {
      const e = meshList[i]
      const m = e.mesh as any

      if (!visible) { m.visible = false; continue }

      let show = true
      if (isSplanchnology) {
        if (isSkinCol)       show = e.isSkin && activeSystems.integumentary
        else if (isOrganCol) {
          if (e.isSkin)                                                    show = false
          else if (e.isBrain   && !activeSystems.nervous)                  show = false
          else if (e.isHeart   && !activeSystems.cardiovascular)           show = false
          else if (e.isRespiratory && !activeSystems.respiratory && !activeSystems.digestive) show = false
          else if (e.isDigestive  && !activeSystems.digestive)             show = false
        }
      } else if (isScene)       show = e.isVessel && activeSystems.cardiovascular
      else if (isMyology)     show = activeSystems.muscular
      else if (isSkeletonGLB) show = activeSystems.skeletal
      else if (isJoe) {
        if (splitPositionX === -2.4) show = activeSystems.integumentary
        else show = false
      }

      m.visible = show

      // Keep Joe model fully solid/opaque as originally textured
      if (isJoe) {
        for (let j = 0; j < e.mats.length; j++) {
          const mat = e.mats[j] as any
          if (!mat) continue
          if (mat.transparent !== false || mat.opacity !== 1.0) {
            mat.transparent = false
            mat.opacity = 1.0
            mat.depthWrite = true
            mat.needsUpdate = true
          }
        }
      }

      // Emissive highlight — check both mesh name AND all material names
      const hl = highlightedMeshNames.length > 0 && (
        highlightedMeshNames.some(r => e.name.includes(r)) ||
        e.mats.some((mat: any) => mat?.name && highlightedMeshNames.some(r => mat.name.toLowerCase().includes(r)))
      )
      const ti = hl ? 2.2 : 0.0
      for (let j = 0; j < e.mats.length; j++) {
        const mat = e.mats[j] as any
        if (!mat?.emissive) continue
        if (mat.emissiveIntensity !== ti) {
          mat.emissive.set(hl ? '#ef4444' : '#000000')
          mat.emissiveIntensity = ti
          mat.needsUpdate = true
        }
      }
    }
    invalidate()
  }, [meshList, activeSystems, highlightedMeshNames, splitPositionX, path, visible, invalidate])

  // ─────────────────────────────────────────────────────────────────────────────
  // Per-column callout layout computation
  // ─────────────────────────────────────────────────────────────────────────────
  // Determine which organs this column is responsible for displaying labels on.
  // COLUMN_SCOPE[key]: null = all, string[] = only those IDs, missing key = none
  const colKey = String(splitPositionX)
  const colScope = Object.prototype.hasOwnProperty.call(COLUMN_SCOPE, colKey)
    ? COLUMN_SCOPE[colKey]
    : []  // default: no callouts (e.g. skeleton FBX column at 0)
  const [colLX, colRX] = COLUMN_LX[colKey] ?? [-0.58, 0.58]
  const isOrgansModel  = splitPositionX === -1.2 && path.includes('splanchnology')

  // Filter affectedOrganIds to only the organs visible in this column
  const columnAffectedIds = useMemo(() => {
    if (colScope === null) return affectedOrganIds        // organs column: show all
    if (!colScope || colScope.length === 0) return []    // no callouts for this column
    return affectedOrganIds.filter(id => (colScope as string[]).includes(id))
  }, [affectedOrganIds, colKey])  // eslint-disable-line react-hooks/exhaustive-deps

  const calloutLayout = useMemo(
    () => computeCalloutLayout(columnAffectedIds, colLX, colRX),
    [columnAffectedIds, colLX, colRX]
  )

  return (
    <group
      ref={groupRef}
      renderOrder={renderOrder}
      onClick={(e) => { e.stopPropagation(); onModelClick() }}
    >
      <primitive object={cloned} />

      {/* ── Render 3D HTML Labels ── */}
      {annotations.map((ann, i) => {
         const isSplitted = viewMode === 'split' && isSplittedRef.current
         const offsetY = (isSplitted && ann.mesh.userData.offsetY) ? ann.mesh.userData.offsetY : 0
         
         const isAdjusting = activeAdjustOrgan === ann.organ
         const offset = labelOffsets?.[ann.organ] || { x: 0, y: 0, z: 0 }

         return (
           <group key={`ann-group-${i}`}>
             {isAdjusting && onAdjustLabel && (
               <ActiveTransformTarget 
                 organId={ann.organ}
                 baseX={ann.baseX}
                 baseY={ann.baseY + offsetY}
                 baseZ={ann.baseZ}
                 offset={offset}
                 onAdjust={onAdjustLabel}
               />
             )}
             
             <Html
               position={[ann.x, ann.y + offsetY, ann.z + 0.1]}
               center
               zIndexRange={[100, 0]}
               className="pointer-events-auto cursor-pointer"
             >
               <div className="relative group">
                 {/* Connecting Dot */}
                 {!isAdjusting && (
                   <div className="absolute top-1/2 left-0 w-2 h-2 -translate-y-1/2 -translate-x-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
                 )}
                 
                 {/* Label Box */}
                 <div 
                   onClick={(e) => {
                     e.stopPropagation()
                     if (onOrganClick) onOrganClick(ann.organ, ann.condition, ann.reasoning, ann.severity)
                   }}
                   className={`ml-4 px-3 py-1.5 backdrop-blur-xl border rounded-lg shadow-2xl flex flex-col min-w-[120px] transition-transform duration-300 hover:scale-105 ${
                   ann.severity?.toLowerCase() === 'high' || ann.severity?.toLowerCase() === 'critical' ? 'bg-red-950/80 border-red-500/50 hover:bg-red-900/90' : 
                   ann.severity?.toLowerCase() === 'low' ? 'bg-green-950/80 border-green-500/50 hover:bg-green-900/90' : 
                   'bg-amber-950/80 border-amber-500/50 hover:bg-amber-900/90'
                 }`}>
                   <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest font-mono mb-0.5">{ann.organ.replace('_', ' ')}</span>
                   <span className="text-[11px] font-bold text-white leading-tight drop-shadow-md">{ann.condition}</span>
                 </div>
               </div>
             </Html>
           </group>
         )
      })}


    </group>
  )
})

// Helper type alias so useMemo infers correctly
function buildMeshList(_clone: THREE.Group) { return [] as any[] }

// ---------------------------------------------------------
// FBX Model (Skeletal) — performance-optimised
// ---------------------------------------------------------
const RealisticFBXModel = React.memo(function RealisticFBXModel({
  path, positionX, activeSystems, viewMode, visible, isSplittedRef, affectedOrganIds, conditionsByOrgan, onModelClick, onOrganClick, labelOffsets, activeAdjustOrgan, onAdjustLabel
}: {
  path: string; positionX: number; activeSystems: SystemToggles; viewMode: 'split' | 'single'; visible: boolean; isSplittedRef: React.MutableRefObject<boolean>; affectedOrganIds: string[]; conditionsByOrgan: any; onModelClick: () => void; onOrganClick?: (organ: string, condition?: string, reasoning?: string, severity?: string) => void; labelOffsets?: Record<string, { x: number, y: number, z: number }>; activeAdjustOrgan?: string | null; onAdjustLabel?: (organ: string, x: number, y: number, z: number) => void
}) {
  const fbx = useFBX(path)
  const groupRef = useRef<THREE.Group>(null)
  const { invalidate } = useThree()

  const { clone: cloned, fbxMeshes } = useMemo(() => {
    const clone = SkeletonUtils.clone(fbx)
    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    const fbxMeshes: { mesh: any; mats: any[] }[] = []

    clone.traverse((child: any) => {
      if (
        child.isLine || 
        child.isLineSegments || 
        child instanceof THREE.Line || 
        child.name.toLowerCase().includes('line') ||
        child.name.toLowerCase().includes('helper')
      ) {
        child.visible = false
        return
      }
      if (!(child instanceof THREE.Mesh)) return
      const name = child.name.toLowerCase()
      if (name.includes('floor') || name.includes('ground') || name.includes('plane')) return
      if (child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
        const mb = child.geometry.boundingBox!.clone().applyMatrix4(child.matrixWorld)
        if (!hasMesh) { box.copy(mb); hasMesh = true } else box.union(mb)
      }
      // Strip unused skin attributes
      const m = child as any
      if (!m.isSkinnedMesh && m.geometry) {
        if (m.geometry.attributes.skinIndex) m.geometry.deleteAttribute('skinIndex')
        if (m.geometry.attributes.skinWeight) m.geometry.deleteAttribute('skinWeight')
      }
      // Clone materials once
      if (m.material) {
        m.material = Array.isArray(m.material)
          ? m.material.map((mat: any) => mat.clone ? mat.clone() : mat)
          : m.material.clone ? m.material.clone() : m.material
      }
      child.castShadow = false; child.receiveShadow = false
      const mats: any[] = Array.isArray(child.material) ? child.material : [child.material]
      // One-time material setup
      mats.forEach((mat: any) => { if (mat) { mat.transparent = true; mat.opacity = 0.92 } })
      fbxMeshes.push({ mesh: child, mats })
    })

    if (!hasMesh) box.setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const scaleFactor = 2.0 / (size.y || 1)
    clone.scale.setScalar(scaleFactor)
    clone.position.set(0, -box.min.y * scaleFactor - 1.0, -box.getCenter(new THREE.Vector3()).z * scaleFactor)
    clone.updateMatrixWorld(true) // Fix: Update matrix world after scale/position so annotations get correct world coords
    return { clone, fbxMeshes }
  }, [fbx])


  // ── Compute Annotation Labels ────────────────────────────────────────────────
  const annotations = useMemo(() => {
    if (!conditionsByOrgan || Object.keys(conditionsByOrgan).length === 0) return []
    
    const out: { organ: string, condition: string, severity: string, x: number, y: number, z: number, mesh: THREE.Object3D }[] = []
    const seenOrgans = new Set<string>()

    cloned.traverse((c: any) => {
      if (!(c instanceof THREE.Mesh)) return
      
      const name = c.name.toLowerCase()
      const matNames = Array.isArray(c.material) ? c.material.map((m: any) => m?.name?.toLowerCase() || '') : [c.material?.name?.toLowerCase() || '']
      let organId = null
      
      for (const org of affectedOrganIds) {
        const query = org.replace('_', '')
        const querySplit = org.split('_')[0]
        
        if (
           name.includes(query) || name.includes(querySplit) ||
           matNames.some(n => n.includes(query) || n.includes(querySplit))
        ) {
           organId = org
           break
        }
      }
      
      if (organId && conditionsByOrgan[organId] && !seenOrgans.has(organId)) {
         seenOrgans.add(organId)
         
         if (!c.geometry.boundingBox) c.geometry.computeBoundingBox()
         const center = new THREE.Vector3()
         c.geometry.boundingBox.getCenter(center)
         
         // Fix double-shifting by using local coordinates relative to the clone
         const worldCenter = center.clone().applyMatrix4(c.matrixWorld)
         const localCenter = cloned.worldToLocal(worldCenter)
         
         const offset = labelOffsets?.[organId] || { x: 0, y: 0, z: 0 }
         
         out.push({
           organ: organId,
           condition: conditionsByOrgan[organId].condition,
           severity: conditionsByOrgan[organId].severity || 'Medium',
           baseX: localCenter.x,
           baseY: localCenter.y,
           baseZ: localCenter.z,
           x: localCenter.x + offset.x,
           y: localCenter.y + offset.y,
           z: localCenter.z + offset.z,
           mesh: c,
           reasoning: conditionsByOrgan[organId].reasoning || ''
         })
      }
    })
    return out
  }, [cloned, affectedOrganIds, conditionsByOrgan, labelOffsets])

  // Visibility — iterate cached array only
  useEffect(() => {
    const show = visible && activeSystems.skeletal
    for (let i = 0; i < fbxMeshes.length; i++) {
      fbxMeshes[i].mesh.visible = show
    }
    invalidate()
  }, [fbxMeshes, activeSystems.skeletal, visible, invalidate])

  useFrame(() => {
    if (!groupRef.current) return
    const targetX = (viewMode === 'split' && isSplittedRef.current) ? positionX : 0.0
    const dx = groupRef.current.position.x - targetX
    if (Math.abs(dx) > 0.001) { groupRef.current.position.x += dx * -0.35; invalidate() }
  })

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onModelClick() }}>
      <primitive object={cloned} />

      {/* ── Render 3D HTML Labels ── */}
      {annotations.map((ann, i) => {
         const isSplitted = viewMode === 'split' && isSplittedRef.current
         const offsetY = (isSplitted && ann.mesh.userData.offsetY) ? ann.mesh.userData.offsetY : 0
         
         const isAdjusting = activeAdjustOrgan === ann.organ
         const offset = labelOffsets?.[ann.organ] || { x: 0, y: 0, z: 0 }

         return (
           <group key={`ann-group-${i}`}>
             {isAdjusting && onAdjustLabel && (
               <ActiveTransformTarget 
                 organId={ann.organ}
                 baseX={ann.baseX}
                 baseY={ann.baseY + offsetY}
                 baseZ={ann.baseZ}
                 offset={offset}
                 onAdjust={onAdjustLabel}
               />
             )}
             
             <Html
               position={[ann.x, ann.y + offsetY, ann.z + 0.05]}
               center
               zIndexRange={[100, 0]}
               className="pointer-events-auto cursor-pointer"
             >
               <div className="relative group">
                 {/* Connecting Dot */}
                 {!isAdjusting && (
                   <div className="absolute top-1/2 left-0 w-2 h-2 -translate-y-1/2 -translate-x-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
                 )}
                 
                 {/* Label Box */}
                 <div 
                   onClick={(e) => {
                     e.stopPropagation()
                     if (onOrganClick) onOrganClick(ann.organ, ann.condition, ann.reasoning, ann.severity)
                   }}
                   className={`ml-4 px-3 py-1.5 backdrop-blur-xl border rounded-lg shadow-2xl flex flex-col min-w-[120px] transition-transform duration-300 hover:scale-105 ${
                   ann.severity?.toLowerCase() === 'high' || ann.severity?.toLowerCase() === 'critical' ? 'bg-red-950/80 border-red-500/50 hover:bg-red-900/90' : 
                   ann.severity?.toLowerCase() === 'low' ? 'bg-green-950/80 border-green-500/50 hover:bg-green-900/90' : 
                   'bg-amber-950/80 border-amber-500/50 hover:bg-amber-900/90'
                 }`}>
                   <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest font-mono mb-0.5">{ann.organ.replace('_', ' ')}</span>
                   <span className="text-[11px] font-bold text-white leading-tight drop-shadow-md">{ann.condition}</span>
                 </div>
               </div>
             </Html>
           </group>
         )
      })}
    </group>
  )
})

// ---------------------------------------------------------
// View Anatomy Page
// ---------------------------------------------------------


interface InteractiveAnatomyViewerProps {
  affectedOrganIds?: string[];
  conditionsByOrgan?: Record<string, { condition: string; reasoning: string; severity: string }>;
  highlightedMeshNames: string[];
  onOrganClick: (organ: string, condition?: string, reasoning?: string, severity?: string) => void;
  viewMode: 'split' | 'single';
  setViewMode: React.Dispatch<React.SetStateAction<'split' | 'single'>>;
}

export function InteractiveAnatomyViewer({
  affectedOrganIds = [],
  conditionsByOrgan = {},
  highlightedMeshNames,
  onOrganClick,
  viewMode,
  setViewMode
}: InteractiveAnatomyViewerProps) {
  const isSplittedRef = useRef<boolean>(false)
  const cameraRef = useRef<CameraHandle>(null)

  const [labelOffsets, setLabelOffsets] = useState<Record<string, { x: number, y: number, z: number }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('anatomy-label-offsets')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  useEffect(() => {
    localStorage.setItem('anatomy-label-offsets', JSON.stringify(labelOffsets))
  }, [labelOffsets])

  const [activeAdjustOrgan, setActiveAdjustOrgan] = useState<string | null>(null)
  
  const adjustableOrgans = affectedOrganIds.filter(id => conditionsByOrgan[id])

  useEffect(() => {
    if (adjustableOrgans.length > 0 && !activeAdjustOrgan) {
      setActiveAdjustOrgan(adjustableOrgans[0])
    }
  }, [adjustableOrgans, activeAdjustOrgan])

  const adjustOffset = (organ: string, axis: 'x' | 'y' | 'z', delta: number) => {
    setLabelOffsets(prev => {
      const current = prev[organ] || { x: 0, y: 0, z: 0 }
      return {
        ...prev,
        [organ]: {
          ...current,
          [axis]: parseFloat((current[axis] + delta).toFixed(3))
        }
      }
    })
  }

  const resetOffset = (organ: string) => {
    setLabelOffsets(prev => {
      const copy = { ...prev }
      delete copy[organ]
      return copy
    })
  }

  const copyCoordinatesToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(labelOffsets, null, 2))
    alert('Label offsets copied to clipboard! You can paste them in the chat.')
  }

  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true,
    muscular: true,
    nervous: true,
    cardiovascular: true,
    respiratory: true,
    digestive: true,
    lymphatic: true,
    integumentary: true,
  })

  const toggleSystem = (sys: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [sys]: !prev[sys] }))
  }

  // Mirror viewMode to the high-performance ref for useFrame access without dependency triggers
  useEffect(() => {
    isSplittedRef.current = viewMode === 'split'
  }, [viewMode])

  const handleModelClick = (meshName: string) => {
    console.log("Model clicked:", meshName)
    setViewMode(prev => prev === 'split' ? 'single' : 'split')
  }

  // Re-map handleOrganClick from center column to props.onOrganClick
  const handleOrganClick = (organ: string, condition?: string, reasoning?: string, sev?: string) => {
    onOrganClick(organ, condition, reasoning, sev)
  }

  return (
    <>
      {/* CENTER COLUMN: 3D Visualization Viewport (53% Width) */}
      <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden relative">
          
          <div className="flex-1 bg-black rounded-none overflow-hidden relative flex flex-col shadow-sm">
            
            {/* Visual Instruction Badge */}
            <div className="absolute top-4 left-4 z-10 bg-black/90 border border-blue-950/50 rounded px-2.5 py-1 text-[9px] text-primary uppercase tracking-widest font-mono shadow-sm flex items-center gap-1.5 animate-pulse">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span id="split-status-text">
                Standing Human (Click human to Split)
              </span>
            </div>

            {/* 🔧 LABEL ADJUSTMENT CONSOLE: Floating card on Canvas (Right side) */}
            {adjustableOrgans.length > 0 && (
              <div className="absolute right-4 top-16 z-20 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl flex flex-col gap-3 font-mono text-[9px] w-64 max-h-[85vh] overflow-y-auto">
                <span className="text-cyan-400 font-bold block text-[10px] border-b border-cyan-500/20 pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🔧</span> Label Adjuster Console
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider">Select Label to Reposition</label>
                  <select 
                    value={activeAdjustOrgan || ''} 
                    onChange={(e) => setActiveAdjustOrgan(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-white text-[9px] outline-none focus:border-cyan-500/40"
                  >
                    {adjustableOrgans.map(org => (
                      <option key={org} value={org}>
                        {org.replace(/_/g, ' ').toUpperCase()} ({conditionsByOrgan[org]?.condition.substring(0, 15)}...)
                      </option>
                    ))}
                  </select>
                </div>

                {activeAdjustOrgan && (
                  <div className="flex flex-col gap-2.5 mt-1 pt-2.5 border-t border-white/5 text-gray-300">
                    <p className="text-[10px] leading-relaxed text-cyan-300 font-bold">
                      💡 Click & Drag the 🔴 red target dot with 3D arrows directly on the model to move the label.
                    </p>
                    <p className="text-[8px] text-gray-400 leading-normal">
                      The camera rotation is automatically disabled while dragging the target point.
                    </p>
                    
                    {/* Active Values */}
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded text-[8px] text-cyan-300 font-bold border border-cyan-500/10 mt-1">
                      <span>X: {(labelOffsets[activeAdjustOrgan]?.x || 0).toFixed(3)}</span>
                      <span>Y: {(labelOffsets[activeAdjustOrgan]?.y || 0).toFixed(3)}</span>
                      <span>Z: {(labelOffsets[activeAdjustOrgan]?.z || 0).toFixed(3)}</span>
                    </div>

                    {/* Reset button */}
                    <button 
                      onClick={() => resetOffset(activeAdjustOrgan)}
                      className="w-full mt-1.5 py-1 rounded bg-red-950/20 border border-red-500/30 hover:bg-red-900/30 text-red-400 text-[8px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Reset This Position
                    </button>
                  </div>
                )}

                {/* Exporter */}
                <div className="flex flex-col gap-1.5 mt-2 pt-2.5 border-t border-white/10">
                  <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider">Reposition Config Output</span>
                  <pre className="w-full bg-black/80 border border-white/10 rounded p-2 text-[7.5px] text-cyan-300 overflow-x-auto max-h-24 select-all font-mono leading-relaxed">
                    {JSON.stringify(labelOffsets, null, 2)}
                  </pre>
                  <button 
                    onClick={copyCoordinatesToClipboard}
                    className="w-full py-1.5 bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/60 rounded text-cyan-300 font-bold uppercase tracking-widest text-[8px] transition cursor-pointer"
                  >
                    Copy Offset Coordinates
                  </button>
                </div>
              </div>
            )}

            {/* CLINICIAN CHECKBOX SELECTOR: Floating card on Canvas */}
            <div className="absolute left-4 top-16 z-20 glass-panel border-white/5 rounded-xl p-3 shadow-md flex flex-col gap-2 font-mono text-[9px] w-40">
              <span className="text-on-surface-variant font-bold block mb-1 text-[8.5px] border-b border-white/10 pb-1 uppercase tracking-wider">Select Layers</span>
              {[
                { label: 'Outer Body', key: 'integumentary', icon: '👤', color: 'text-emerald-400' },
                { label: 'Skeleton',  key: 'skeletal',       icon: '🦴', color: 'text-amber-400' },
                { label: 'Muscles',   key: 'muscular',       icon: '💪', color: 'text-rose-400'  },
                { label: 'Organs',    key: 'digestive',      icon: '🫀', color: 'text-red-400'   },
                { label: 'Vessels',   key: 'cardiovascular', icon: '🩸', color: 'text-blue-400'  }
              ].map(sys => {
                const isActive = (systems as any)[sys.key]
                return (
                  <label key={sys.key} className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.03] rounded-md px-1 py-0.5 transition-all font-medium group">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleSystem(sys.key as any)}
                      className="w-3.5 h-3.5 rounded border-white/10 accent-primary cursor-pointer pointer-events-auto shrink-0"
                    />
                    <span className="text-sm">{sys.icon}</span>
                    <span className={`transition-colors ${isActive ? `${sys.color} font-bold` : 'text-on-surface-variant group-hover:text-slate-400'}`}>
                      {sys.label}
                    </span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />}
                  </label>
                )
              })}
              {/* Empty state hint */}
              {!Object.entries(systems).some(([k, v]) => k !== 'lymphatic' && v === true) && (
                <p className="text-[8px] text-slate-600 text-center mt-1 leading-tight border-t border-blue-950/20 pt-1">
                  ☝️ Check a box<br/>to show that layer
                </p>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full h-full relative z-0">

              {/* ── Empty State Overlay ── shown when NO layer is selected */}
              {!Object.values(systems).some(Boolean) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-4 text-center px-8">
                    {/* Animated body silhouette */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-900/30 animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-2 rounded-full border border-blue-900/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                      <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-on-surface-variant text-xs font-mono font-bold uppercase tracking-widest mb-1">No Layers Selected</p>
                      <p className="text-slate-700 text-[10px] font-sans leading-relaxed">
                        Select anatomy layers from the panel<br />on the left or the buttons below
                      </p>
                    </div>
                    {/* Mini quick-select row */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      {[
                        { label: 'Skeleton', key: 'skeletal' as keyof SystemToggles, icon: '🦴' },
                        { label: 'Muscles',  key: 'muscular' as keyof SystemToggles, icon: '💪' },
                        { label: 'Organs',   key: 'digestive' as keyof SystemToggles, icon: '🫀' },
                      ].map(s => (
                        <button
                          key={s.key}
                          className="pointer-events-auto px-3 py-1.5 rounded-lg border border-blue-950/40 bg-black/40 text-on-surface-variant text-[9px] font-bold hover:border-cyan-500/30 hover:text-primary transition-all cursor-pointer flex items-center gap-1"
                          onClick={() => toggleSystem(s.key)}
                        >
                          <span>{s.icon}</span>{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Canvas 
                camera={{ position: [0, 0.2, 4.6], fov: 50 }} 
                dpr={[1, 1.5]} 
                gl={{ 
                  antialias: false, 
                  powerPreference: 'high-performance', 
                  alpha: false, 
                  stencil: false, 
                  depth: true,
                  precision: 'mediump'
                }}
                flat={true}
                performance={{ min: 0.5 }}
                frameloop="demand"
                className="w-full h-full" 
                style={{ position: 'absolute', inset: 0 }}
              >
                {/* Dark clinical background */}
                <color attach="background" args={['#0a0f1d']} />
                
                {/* Minimal 3-light studio rig — fast, no shadows */}
                <ambientLight intensity={0.9} color="#ffffff" />
                <directionalLight position={[8, 14, 6]} intensity={2.2} color="#ffffff" />
                <directionalLight position={[-8, 8, -4]} intensity={1.0} color="#ddd8f0" />

                <Suspense fallback={null}>
                  {/* Column 2: Visceral Organs — visible when ANY organ system is active */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/splanchnology.glb" 
                      positionX={viewMode === 'single' ? 0.0 : -1.2} 
                      splitPositionX={-1.2}
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={systems.digestive || systems.respiratory || systems.cardiovascular || systems.nervous}
                      isSplittedRef={isSplittedRef}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                      onOrganClick={handleOrganClick}
                      labelOffsets={labelOffsets}
                      activeAdjustOrgan={activeAdjustOrgan}
                      onAdjustLabel={adjustOffset}
                    />
                  </Suspense>
                  
                  {/* Column 3: Skeletal System (from free_pack_-_human_skeleton.glb) */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/free_pack_-_human_skeleton.glb" 
                      positionX={viewMode === 'single' ? 0.0 : 0.0} 
                      splitPositionX={0.0}
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={systems.skeletal}
                      isSplittedRef={isSplittedRef}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                      labelOffsets={labelOffsets}
                      activeAdjustOrgan={activeAdjustOrgan}
                      onAdjustLabel={adjustOffset}
                    />
                  </Suspense>

                  {/* Column 4: Cardiovascular vessels */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/scene-v1 (1).glb" 
                      positionX={viewMode === 'single' ? 0.0 : 1.2} 
                      splitPositionX={1.2}
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={systems.cardiovascular}
                      isSplittedRef={isSplittedRef}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                      labelOffsets={labelOffsets}
                      activeAdjustOrgan={activeAdjustOrgan}
                      onAdjustLabel={adjustOffset}
                    />
                  </Suspense>

                  {/* Column 5: Muscular system */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/myology-v1.glb" 
                      positionX={viewMode === 'single' ? 0.0 : 2.4} 
                      splitPositionX={2.4}
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={systems.muscular}
                      isSplittedRef={isSplittedRef}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                      labelOffsets={labelOffsets}
                      activeAdjustOrgan={activeAdjustOrgan}
                      onAdjustLabel={adjustOffset}
                    />
                  </Suspense>

                  {/* Column 1: Joe (Realistic Human Body) — Rendered last with high renderOrder to paint over other layers */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/joe__realistic_human_3d_model.glb" 
                      positionX={viewMode === 'single' ? 0.0 : -2.4} 
                      splitPositionX={-2.4}
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={systems.integumentary}
                      isSplittedRef={isSplittedRef}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                      onOrganClick={handleOrganClick}
                      labelOffsets={labelOffsets}
                      activeAdjustOrgan={activeAdjustOrgan}
                      onAdjustLabel={adjustOffset}
                      renderOrder={10}
                    />
                  </Suspense>
                </Suspense>


                {/* Lightweight floor line grid — zero render cost */}
                <gridHelper 
                  args={[8.0, 20, '#1e293b', '#0f172a']} 
                  position={[0, -0.99, 0]}
                />

                <InvalidateBridge />
                <CameraController ref={cameraRef} />
              </Canvas>
            </div>

            {/* ────────────────────────────────────────────────────
                Camera Control HUD — floating icon panel bottom-right
                D-pad rotate, zoom +/−, view presets, reset
            ──────────────────────────────────────────────────── */}
            <div
              className="absolute bottom-14 right-3 z-30 flex flex-col gap-1.5 select-none"
              style={{ pointerEvents: 'auto' }}
            >
              {/* Panel header label */}
              <div className="flex items-center gap-1.5 mb-0.5 justify-end pr-0.5">
                <span className="text-[7.5px] text-on-surface-variant font-mono uppercase tracking-[0.14em] font-bold">Camera Controls</span>
                <Navigation className="w-2.5 h-2.5 text-cyan-500/60" />
              </div>

              {/* D-pad: Tilt Up */}
              <div className="flex justify-center">
                <button
                  onClick={() => cameraRef.current?.tiltUp()}
                  title="Tilt Up"
                  className="w-7 h-7 rounded-lg bg-surface-variant/80 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/20 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* D-pad row: Rotate Left | [Crosshair/Front] | Rotate Right */}
              <div className="flex gap-1">
                <button
                  onClick={() => cameraRef.current?.rotateLeft()}
                  title="Rotate Left"
                  className="w-7 h-7 rounded-lg bg-surface-variant/80 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/20 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => cameraRef.current?.frontView()}
                  title="Front View"
                  className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-primary hover:text-cyan-200 hover:border-cyan-400/60 hover:bg-cyan-900/40 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <Crosshair className="w-3 h-3" />
                </button>
                <button
                  onClick={() => cameraRef.current?.rotateRight()}
                  title="Rotate Right"
                  className="w-7 h-7 rounded-lg bg-surface-variant/80 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/20 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* D-pad: Tilt Down */}
              <div className="flex justify-center">
                <button
                  onClick={() => cameraRef.current?.tiltDown()}
                  title="Tilt Down"
                  className="w-7 h-7 rounded-lg bg-surface-variant/80 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/20 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-blue-950/50 my-0.5 mx-1" />

              {/* Zoom row */}
              <div className="flex gap-1">
                <button
                  onClick={() => cameraRef.current?.zoomIn()}
                  title="Zoom In"
                  className="flex-1 h-7 rounded-lg bg-[#0d1526]/90 border border-blue-950/70 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-950/25 flex items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span className="text-[7px] font-mono font-bold">IN</span>
                </button>
                <button
                  onClick={() => cameraRef.current?.zoomOut()}
                  title="Zoom Out"
                  className="flex-1 h-7 rounded-lg bg-[#0d1526]/90 border border-blue-950/70 text-slate-400 hover:text-orange-300 hover:border-orange-500/50 hover:bg-orange-950/25 flex items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer backdrop-blur-md shadow-lg"
                >
                  <ZoomOut className="w-3 h-3" />
                  <span className="text-[7px] font-mono font-bold">OUT</span>
                </button>
              </div>

              {/* View presets row */}
              <div className="flex gap-1">
                <button
                  onClick={() => cameraRef.current?.sideView()}
                  title="Side View (Right)"
                  className="flex-1 h-6 rounded-md bg-[#0d1526]/90 border border-blue-950/70 text-on-surface-variant hover:text-cyan-300 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md text-[7px] font-mono font-bold gap-0.5"
                >
                  <RotateCw className="w-2.5 h-2.5" /> SIDE
                </button>
                <button
                  onClick={() => cameraRef.current?.topView()}
                  title="Top View"
                  className="flex-1 h-6 rounded-md bg-[#0d1526]/90 border border-blue-950/70 text-on-surface-variant hover:text-cyan-300 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md text-[7px] font-mono font-bold gap-0.5"
                >
                  <Eye className="w-2.5 h-2.5" /> TOP
                </button>
                <button
                  onClick={() => cameraRef.current?.reset()}
                  title="Reset Camera"
                  className="w-7 h-6 rounded-md bg-[#0d1526]/90 border border-blue-950/70 text-on-surface-variant hover:text-red-300 hover:border-red-500/40 flex items-center justify-center transition-all duration-150 cursor-pointer backdrop-blur-md"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* System layers checklist panel at bottom of viewport */}
            <div className="p-3 bg-[#0b132b] border-t border-white/10 z-10 flex flex-wrap gap-2 text-[9px] justify-center items-center pointer-events-auto">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider mr-1">Layers:</span>
              {[
                { label: 'Skin',     key: 'integumentary', icon: '🫁', active: 'bg-orange-950/60 border-orange-400/30 text-orange-300' },
                { label: 'Skeleton', key: 'skeletal',       icon: '🦴', active: 'bg-amber-950/60  border-amber-400/30  text-amber-400'  },
                { label: 'Muscles',  key: 'muscular',       icon: '💪', active: 'bg-rose-950/60   border-rose-400/30   text-rose-400'   },
                { label: 'Organs',   key: 'digestive',      icon: '🫀', active: 'bg-red-950/60    border-red-400/30    text-red-400'    },
                { label: 'Vessels',  key: 'cardiovascular', icon: '🩸', active: 'bg-blue-950/60   border-blue-400/30   text-blue-400'   },
                { label: 'Nerves',   key: 'nervous',        icon: '⚡', active: 'bg-yellow-950/60 border-yellow-400/30 text-yellow-400' }
              ].map(sys => {
                const isActive = (systems as any)[sys.key]
                return (
                  <button
                    key={sys.key}
                    onClick={() => toggleSystem(sys.key as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                      isActive
                        ? `${sys.active} shadow-sm`
                        : 'bg-black/35 border-blue-950/20 text-slate-600 hover:text-slate-400 hover:border-blue-950/40'
                    }`}
                  >
                    <span>{sys.icon}</span>
                    {sys.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
    </>
  )
}
