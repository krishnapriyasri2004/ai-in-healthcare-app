'use client'

import React, { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Treatment knowledge base for heart conditions ─────────────────────── */
const HEART_TREATMENTS: Record<string, {
  region: string
  description: string
  needsAngiogram: boolean
  treatments: { name: string; type: string; details: string }[]
}> = {
  'myocardial infarction': {
    region: 'Left Anterior Descending (LAD) artery territory',
    description: 'Blockage in coronary arteries causing ischemic damage to myocardium. Most commonly affects the left ventricle.',
    needsAngiogram: true,
    treatments: [
      { name: 'Coronary Angiogram', type: 'Diagnostic', details: 'Catheter-based X-ray imaging of coronary arteries to locate blockages. Performed via femoral or radial artery access.' },
      { name: 'Percutaneous Coronary Intervention (PCI)', type: 'Interventional', details: 'Balloon angioplasty with stent placement to restore blood flow. Drug-eluting stents preferred to prevent restenosis.' },
      { name: 'Coronary Artery Bypass Grafting (CABG)', type: 'Surgical', details: 'Open-heart surgery using grafted vessels (saphenous vein or internal mammary artery) to bypass blocked coronary arteries.' },
      { name: 'Thrombolytic Therapy', type: 'Pharmacological', details: 'IV administration of clot-dissolving agents (Tenecteplase, Alteplase) within the golden window of 6 hours from symptom onset.' },
    ]
  },
  'angina pectoris': {
    region: 'Coronary artery tree — typically LAD, RCA, or LCx',
    description: 'Chest pain from reduced blood flow to the heart muscle due to partial coronary artery obstruction.',
    needsAngiogram: true,
    treatments: [
      { name: 'Coronary Angiogram', type: 'Diagnostic', details: 'Gold standard to visualize degree and location of coronary stenosis.' },
      { name: 'Stress Test (TMT/DSE)', type: 'Diagnostic', details: 'Treadmill or Dobutamine stress echocardiography to provoke ischemia under controlled conditions.' },
      { name: 'Anti-anginal Therapy', type: 'Pharmacological', details: 'Sublingual Nitroglycerin for acute relief. Long-term: Beta-blockers (Metoprolol), Calcium channel blockers (Amlodipine), Nitrates (Isosorbide).' },
      { name: 'PCI with Stenting', type: 'Interventional', details: 'Indicated for significant stenosis (>70%). Drug-eluting stent deployment at the lesion site.' },
    ]
  },
  'heart failure': {
    region: 'Ventricular chambers - Left ventricle (systolic) or both ventricles (biventricular)',
    description: 'The heart cannot pump blood efficiently to meet the body\'s metabolic demands. Classified as HFrEF (reduced ejection fraction) or HFpEF (preserved).',
    needsAngiogram: false,
    treatments: [
      { name: '2D Echocardiography', type: 'Diagnostic', details: 'Ultrasound imaging to assess ejection fraction (EF), wall motion abnormalities, valvular function, and chamber dimensions.' },
      { name: 'BNP / NT-proBNP Assay', type: 'Diagnostic', details: 'Serum biomarker to quantify heart failure severity and monitor treatment response.' },
      { name: 'ACE Inhibitors / ARBs / ARNI', type: 'Pharmacological', details: 'Enalapril, Valsartan, or Sacubitril-Valsartan (Entresto) to reduce afterload and cardiac remodeling.' },
      { name: 'Cardiac Resynchronization Therapy (CRT)', type: 'Device', details: 'Biventricular pacemaker implantation for patients with LBBB and EF <=35% to synchronize ventricular contraction.' },
    ]
  },
  'arrhythmia': {
    region: 'Sinoatrial (SA) node, Atrioventricular (AV) node, and conduction pathways',
    description: 'Abnormal heart rhythm — too fast (tachycardia), too slow (bradycardia), or irregular. May originate from atria or ventricles.',
    needsAngiogram: false,
    treatments: [
      { name: '12-Lead ECG + Holter Monitor', type: 'Diagnostic', details: 'Surface ECG for snapshot rhythm analysis. 24–48 hour Holter monitor for intermittent arrhythmia detection.' },
      { name: 'Electrophysiology (EP) Study', type: 'Diagnostic', details: 'Invasive catheter-based mapping of cardiac electrical pathways to identify arrhythmia focus.' },
      { name: 'Catheter Ablation', type: 'Interventional', details: 'Radiofrequency or cryoablation of aberrant electrical pathways (e.g., pulmonary vein isolation for AF).' },
      { name: 'Anti-arrhythmic Drugs', type: 'Pharmacological', details: 'Amiodarone, Flecainide, or Beta-blockers based on arrhythmia type. Rate vs rhythm control strategy.' },
    ]
  },
  'valvular disease': {
    region: 'Cardiac valves — Mitral, Aortic, Tricuspid, or Pulmonary',
    description: 'Stenosis (narrowing) or regurgitation (leaking) of heart valves affecting blood flow dynamics.',
    needsAngiogram: true,
    treatments: [
      { name: 'Coronary Angiogram', type: 'Diagnostic', details: 'Pre-operative angiography to rule out concurrent coronary artery disease before valve surgery.' },
      { name: 'Transthoracic Echocardiography (TTE)', type: 'Diagnostic', details: 'Primary imaging modality to assess valve morphology, gradients, regurgitant volumes, and ventricular function.' },
      { name: 'Transcatheter Valve Replacement (TAVR/TMVR)', type: 'Interventional', details: 'Minimally invasive catheter-based valve replacement, typically for high-surgical-risk patients with aortic stenosis.' },
      { name: 'Surgical Valve Repair/Replacement', type: 'Surgical', details: 'Open-heart surgery for mechanical or bioprosthetic valve replacement. Repair preferred for mitral regurgitation.' },
    ]
  },
  'default': {
    region: 'General cardiac anatomy',
    description: 'The heart is a muscular pump with four chambers. Conditions affecting the heart may involve coronary arteries, valves, myocardium, or the electrical conduction system.',
    needsAngiogram: true,
    treatments: [
      { name: 'Coronary Angiogram', type: 'Diagnostic', details: 'Invasive catheter-based visualization of coronary arteries under fluoroscopy to detect stenosis or blockages.' },
      { name: '2D Echocardiography', type: 'Diagnostic', details: 'Non-invasive ultrasound assessment of cardiac structure and function including ejection fraction and valve integrity.' },
      { name: '12-Lead Electrocardiogram (ECG)', type: 'Diagnostic', details: 'Rapid bedside test recording electrical activity to detect ischemia, arrhythmia, and conduction abnormalities.' },
      { name: 'Cardiac MRI', type: 'Diagnostic', details: 'Gold standard for myocardial tissue characterization, scar assessment, and cardiomyopathy evaluation.' },
    ]
  }
}

function matchHeartTreatment(condition?: string): typeof HEART_TREATMENTS['default'] {
  if (!condition) return HEART_TREATMENTS['default']
  const lower = condition.toLowerCase()
  for (const [key, val] of Object.entries(HEART_TREATMENTS)) {
    if (key === 'default') continue
    if (lower.includes(key) || key.split(' ').every(word => lower.includes(word))) return val
  }
  // Fuzzy match by keywords
  if (lower.includes('infarct') || lower.includes('mi ') || lower.includes('stemi') || lower.includes('nstemi') || lower.includes('acs') || lower.includes('coronary') || lower.includes('heart attack') || lower.includes('heart issue') || lower.includes('heart problem')) return HEART_TREATMENTS['myocardial infarction']
  if (lower.includes('angina') || lower.includes('chest pain') || lower.includes('ischemi')) return HEART_TREATMENTS['angina pectoris']
  if (lower.includes('failure') || lower.includes('cardiomyopathy') || lower.includes('hfref') || lower.includes('hfpef')) return HEART_TREATMENTS['heart failure']
  if (lower.includes('arrhythm') || lower.includes('fibrillat') || lower.includes('tachycard') || lower.includes('bradycard') || lower.includes('flutter')) return HEART_TREATMENTS['arrhythmia']
  if (lower.includes('valve') || lower.includes('stenosis') || lower.includes('regurgit') || lower.includes('prolapse') || lower.includes('mitral') || lower.includes('aortic')) return HEART_TREATMENTS['valvular disease']
  return HEART_TREATMENTS['default']
}

/* ─── Angiogram catheter mapping points on the heart ────────────────────── */
/*
 * These are the key anatomical landmarks for a coronary angiogram procedure.
 * Positions are relative to the normalized heart model (centered at origin, ~2.5 units).
 * The catheter enters via the femoral or radial artery, travels up the aorta,
 * and engages the coronary ostia at the aortic root.
 */
const ANGIOGRAM_POINTS: {
  id: string
  label: string
  shortLabel: string
  position: [number, number, number]
  color: string
  glowColor: string
  description: string
  catheterRole: string
}[] = [
  {
    id: 'aortic_root',
    label: 'Aortic Root / Coronary Ostia',
    shortLabel: 'Aortic Root',
    position: [0.15, 1.15, 0.35],
    color: '#f43f5e',
    glowColor: 'rgba(244,63,94,0.5)',
    description: 'The catheter tip enters the coronary ostia here at the base of the ascending aorta. The Left Main and RCA ostia originate from the sinuses of Valsalva.',
    catheterRole: 'CATHETER ENGAGEMENT POINT — Judkins Left (JL4) for left coronary, Judkins Right (JR4) for right coronary.'
  },
  {
    id: 'left_main',
    label: 'Left Main Coronary Artery (LMCA)',
    shortLabel: 'Left Main',
    position: [0.45, 0.85, 0.45],
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.5)',
    description: 'Short trunk (~10mm) that bifurcates into the LAD and LCx. A >50% stenosis here is critical — "widow maker" territory.',
    catheterRole: 'PRIMARY VISUALIZATION TARGET — Assess for left main disease before PCI/CABG decision.'
  },
  {
    id: 'lad',
    label: 'Left Anterior Descending (LAD)',
    shortLabel: 'LAD',
    position: [0.25, 0.15, 0.65],
    color: '#dc2626',
    glowColor: 'rgba(220,38,38,0.5)',
    description: 'Runs along the anterior interventricular groove. Supplies blood to the anterior wall and apex of the left ventricle and the anterior 2/3 of the interventricular septum.',
    catheterRole: 'STENT PLACEMENT ZONE — Most common site for PCI. Drug-eluting stent deployed at the stenotic lesion under fluoroscopic guidance.'
  },
  {
    id: 'lcx',
    label: 'Left Circumflex Artery (LCx)',
    shortLabel: 'LCx',
    position: [-0.55, 0.55, 0.15],
    color: '#fb923c',
    glowColor: 'rgba(251,146,60,0.5)',
    description: 'Runs in the left atrioventricular groove, supplying the lateral and posterior walls of the left ventricle. Gives off obtuse marginal branches.',
    catheterRole: 'SECONDARY TARGET — Assess for circumflex disease. May require dedicated catheter angulation (LAO Caudal view).'
  },
  {
    id: 'rca',
    label: 'Right Coronary Artery (RCA)',
    shortLabel: 'RCA',
    position: [-0.6, 0.7, 0.45],
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.5)',
    description: 'Runs in the right atrioventricular groove. Supplies the right ventricle, inferior wall of the left ventricle, and the SA/AV nodes in ~85% of patients.',
    catheterRole: 'JR4 CATHETER — Engages the right coronary ostium. LAO view optimal for proximal-mid RCA visualization.'
  },
  {
    id: 'femoral_access',
    label: 'Catheter Access — Femoral Artery',
    shortLabel: 'Femoral Access',
    position: [0.0, -1.35, 0.25],
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.5)',
    description: 'The standard 6F/7F catheter sheath is inserted into the common femoral artery via the Seldinger technique. Alternative access: radial artery (wrist).',
    catheterRole: 'ENTRY POINT — Puncture site at the common femoral artery, 2cm below the inguinal ligament. Closure via manual compression or Angioseal™ device.'
  }
]

/* ─── 3D Annotation Marker ──────────────────────────────────────────────── */
function AngiogramMarker({
  point,
  isSelected,
  onClick
}: {
  point: typeof ANGIOGRAM_POINTS[0]
  isSelected: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing glow effect
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * 3 + ANGIOGRAM_POINTS.indexOf(point) * 1.2) * 0.25
      meshRef.current.scale.setScalar(isSelected ? 1.4 : scale)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02
      const t = state.clock.elapsedTime
      const scale = 1.5 + Math.sin(t * 2) * 0.3
      ringRef.current.scale.setScalar(isSelected ? 2.2 : scale)
    }
  })

  return (
    <group position={point.position}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial
          color={point.color}
          transparent
          opacity={isSelected ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core sphere */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick() }}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={point.color}
          emissive={point.color}
          emissiveIntensity={isSelected ? 2.5 : 1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Short label always visible */}
      <Html
        position={[0, 0.14, 0]}
        center
        distanceFactor={5}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: isSelected ? point.color : 'rgba(0,0,0,0.75)',
          border: `1px solid ${point.color}`,
          borderRadius: '4px',
          padding: '2px 6px',
          whiteSpace: 'nowrap',
          fontSize: '9px',
          fontWeight: 800,
          fontFamily: 'monospace',
          color: isSelected ? '#fff' : point.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          boxShadow: `0 0 8px ${point.glowColor}`,
          transform: 'translateY(-4px)',
        }}>
          {point.shortLabel}
        </div>
      </Html>
    </group>
  )
}

/* ─── Catheter Path Line ─────────────────────────────────────────────────── */
function CatheterPathLine() {
  const lineRef = useRef<THREE.Line>(null!)

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, -1.35, 0.25),   // Femoral access
      new THREE.Vector3(0.0, -0.7, 0.3),     // Iliac artery
      new THREE.Vector3(0.05, -0.1, 0.35),    // Abdominal aorta
      new THREE.Vector3(0.1, 0.5, 0.38),      // Thoracic aorta
      new THREE.Vector3(0.12, 0.9, 0.36),     // Ascending aorta
      new THREE.Vector3(0.15, 1.15, 0.35),    // Aortic root
    ], false, 'catmullrom', 0.5)
    const points = curve.getPoints(60)
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [])

  useFrame((state) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineDashedMaterial
      mat.dashSize = 0.08
      mat.gapSize = 0.04
      // Animate dash offset for flowing effect
      mat.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <line ref={lineRef as any} geometry={geometry}>
      <lineDashedMaterial
        color="#06b6d4"
        dashSize={0.08}
        gapSize={0.04}
        transparent
        opacity={0.6}
        linewidth={1}
      />
    </line>
  )
}

/* ─── 3D Heart Model Component ──────────────────────────────────────────── */
function HeartModel({ showAngiogram, selectedPoint, onPointClick }: {
  showAngiogram: boolean
  selectedPoint: string | null
  onPointClick: (id: string) => void
}) {
  const { scene } = useGLTF('/ai-in-healthcare/asset-01/human_heart.glb')
  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    
    // Compute bounding box and normalize
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = 2.5 / maxDim
    
    clone.scale.setScalar(scale)
    clone.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    )

    // Enhance materials for clinical visualization
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial
          if (mat.isMeshStandardMaterial) {
            mat.roughness = 0.4
            mat.metalness = 0.1
            mat.needsUpdate = true
          }
        }
      }
    })
    
    return clone
  }, [scene])

  const groupRef = useRef<THREE.Group>(null!)
  
  // Slow auto-rotation — pause when angiogram point is selected
  useFrame((_, delta) => {
    if (groupRef.current && !selectedPoint) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />

      {/* Angiogram annotation markers */}
      {showAngiogram && ANGIOGRAM_POINTS.map((point) => (
        <AngiogramMarker
          key={point.id}
          point={point}
          isSelected={selectedPoint === point.id}
          onClick={() => onPointClick(point.id)}
        />
      ))}

      {/* Catheter path line */}
      {showAngiogram && <CatheterPathLine />}
    </group>
  )
}

/* ─── Angiogram Info Panel (shown when a marker is clicked) ──────────────── */
function AngiogramInfoPanel({
  point,
  onClose
}: {
  point: typeof ANGIOGRAM_POINTS[0]
  onClose: () => void
}) {
  return (
    <div className="bg-black/80 border rounded-xl p-3 backdrop-blur-md space-y-2 animate-in fade-in zoom-in-95 duration-200"
      style={{ borderColor: point.color + '60' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: point.color, boxShadow: `0 0 8px ${point.glowColor}` }} />
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: point.color }}>{point.label}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer"
        >✕</button>
      </div>
      <p className="text-[9px] text-slate-300 leading-relaxed font-sans">{point.description}</p>
      <div className="p-2 rounded-lg border" style={{ backgroundColor: point.color + '10', borderColor: point.color + '30' }}>
        <span className="text-[7px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: point.color }}>
          Angiogram Procedure
        </span>
        <p className="text-[8.5px] text-slate-200 leading-relaxed font-sans font-medium">{point.catheterRole}</p>
      </div>
    </div>
  )
}

/* ─── Main Heart Detail Viewer ──────────────────────────────────────────── */
export default function HeartDetailViewer({ 
  condition, 
  reasoning,
  severity,
  onClose 
}: { 
  condition?: string
  reasoning?: string
  severity?: string
  onClose: () => void 
}) {
  const treatment = matchHeartTreatment(condition)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(
    treatment.needsAngiogram ? 'aortic_root' : null
  )
  const [showLabels, setShowLabels] = useState(true)

  const selectedPoint = selectedPointId ? ANGIOGRAM_POINTS.find(p => p.id === selectedPointId) : null
  
  return (
    <div className="absolute inset-0 z-50 flex bg-[#050a14]/95 backdrop-blur-xl">
      {/* Left: 3D Heart Model */}
      <div className="flex-1 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-gray-300 hover:text-white font-bold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
        >
          ← Back to Body
        </button>

        {/* Heart title */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Human Heart — Detailed View
          </h2>
          <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Interactive 3D model • Drag to rotate • Scroll to zoom
            {treatment.needsAngiogram && ' • Click markers for angiogram mapping'}
          </p>
        </div>

        {/* Angiogram toggle */}
        {treatment.needsAngiogram && (
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                showLabels
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showLabels ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
              {showLabels ? '🔬 Angiogram Mapping ON' : 'Angiogram Mapping OFF'}
            </button>
            {selectedPointId && (
              <button
                onClick={() => setSelectedPointId(null)}
                className="px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-white text-[8px] uppercase tracking-wider cursor-pointer transition"
              >
                Deselect Marker
              </button>
            )}
          </div>
        )}

        {/* Affected region indicator */}
        <div className="absolute bottom-4 left-4 z-10 max-w-xs">
          <div className="bg-red-950/60 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
            <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest block mb-1">Affected Region</span>
            <p className="text-[11px] text-red-200 font-medium leading-relaxed">{treatment.region}</p>
          </div>
        </div>

        {/* Angiogram legend */}
        {treatment.needsAngiogram && showLabels && (
          <div className="absolute bottom-4 right-4 z-10 w-[200px]">
            <div className="bg-black/70 border border-cyan-900/40 rounded-lg p-2.5 backdrop-blur-sm">
              <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-widest block mb-1.5 border-b border-cyan-900/30 pb-1">
                📍 Angiogram Landmarks
              </span>
              <div className="space-y-1">
                {ANGIOGRAM_POINTS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPointId(selectedPointId === p.id ? null : p.id)}
                    className={`w-full flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded transition-all cursor-pointer text-[8px] ${
                      selectedPointId === p.id
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: selectedPointId === p.id ? `0 0 6px ${p.glowColor}` : 'none' }} />
                    {p.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#080d1a']} />
          <ambientLight intensity={0.6} color="#ffffff" />
          <directionalLight position={[5, 8, 4]} intensity={2.0} color="#ffffff" />
          <directionalLight position={[-4, 3, -3]} intensity={0.8} color="#ff6b6b" />
          <pointLight position={[0, -3, 2]} intensity={0.5} color="#4ecdc4" />
          
          <Suspense fallback={null}>
            <HeartModel
              showAngiogram={treatment.needsAngiogram && showLabels}
              selectedPoint={selectedPointId}
              onPointClick={(id) => setSelectedPointId(selectedPointId === id ? null : id)}
            />
          </Suspense>
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {/* Right: Clinical Information Panel */}
      <div className="w-[370px] bg-[#0a0f1d]/95 border-l border-red-900/30 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        
        {/* Condition Header */}
        <div className="border-b border-red-900/30 pb-3">
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Detected Condition</span>
          <h3 className="text-base font-bold text-white leading-tight">{condition || 'Cardiac Anomaly'}</h3>
          
          <div className="mt-2.5 space-y-1.5 border-t border-white/5 pt-2">
            <div>
              <span className="text-[7.5px] text-red-400 font-bold uppercase tracking-widest block">Affected Area</span>
              <p className="text-[10px] text-red-200 font-bold font-sans">{treatment.region}</p>
            </div>
            <div>
              <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-widest block">Description</span>
              <p className="text-[9.5px] text-slate-300 leading-relaxed font-sans">{treatment.description}</p>
            </div>
          </div>

          {severity && (
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
              severity.toLowerCase() === 'critical' ? 'bg-red-950/50 text-red-400 border-red-500/30' :
              severity.toLowerCase() === 'high' ? 'bg-orange-950/50 text-orange-400 border-orange-500/30' :
              severity.toLowerCase() === 'medium' ? 'bg-amber-950/50 text-amber-400 border-amber-500/30' :
              'bg-green-950/50 text-green-400 border-green-500/30'
            }`}>
              Severity: {severity}
            </span>
          )}
        </div>

        {/* Clinical Reasoning */}
        {reasoning && (
          <div className="bg-slate-900/50 border border-white/5 rounded-lg p-3">
            <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">AI Clinical Reasoning</span>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{reasoning}</p>
          </div>
        )}

        {/* Selected Angiogram Point Detail */}
        {selectedPoint && treatment.needsAngiogram && (
          <AngiogramInfoPanel
            point={selectedPoint}
            onClose={() => setSelectedPointId(null)}
          />
        )}

        {/* Angiogram Procedure Summary — shown when needsAngiogram */}
        {treatment.needsAngiogram && !selectedPoint && (
          <div className="bg-cyan-950/15 border border-cyan-500/20 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest">Coronary Angiogram Mapping</span>
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
              Click the <span className="text-cyan-300 font-bold">pulsing markers</span> on the 3D heart model to see where the angiogram catheter is placed.
              The dashed line traces the catheter path from femoral access to the coronary ostia.
            </p>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {ANGIOGRAM_POINTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPointId(p.id)}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/20 transition-all cursor-pointer group text-left"
                >
                  <span className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: p.color }} />
                  <span className="text-[7.5px] text-slate-400 group-hover:text-white transition-colors font-medium leading-tight">{p.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pathology Description */}
        <div className="bg-red-950/20 border border-red-900/20 rounded-lg p-3">
          <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest block mb-1">Pathology</span>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{treatment.description}</p>
        </div>

        {/* Treatment Options */}
        <div>
          <h4 className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">
            Recommended Procedures & Treatment
          </h4>
          <div className="flex flex-col gap-2">
            {treatment.treatments.map((tx, i) => (
              <div key={i} className={`bg-black/30 border rounded-lg p-2.5 transition-colors ${
                tx.name.toLowerCase().includes('angiogram') && treatment.needsAngiogram
                  ? 'border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                  : 'border-white/5 hover:border-red-500/20'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                    {tx.name.toLowerCase().includes('angiogram') && treatment.needsAngiogram && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                    {tx.name}
                  </span>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                    tx.type === 'Diagnostic' ? 'bg-blue-950/50 text-blue-400 border-blue-500/20' :
                    tx.type === 'Interventional' ? 'bg-purple-950/50 text-purple-400 border-purple-500/20' :
                    tx.type === 'Surgical' ? 'bg-red-950/50 text-red-400 border-red-500/20' :
                    tx.type === 'Device' ? 'bg-amber-950/50 text-amber-400 border-amber-500/20' :
                    'bg-green-950/50 text-green-400 border-green-500/20'
                  }`}>
                    {tx.type}
                  </span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-relaxed font-sans">{tx.details}</p>
                {tx.name.toLowerCase().includes('angiogram') && treatment.needsAngiogram && (
                  <p className="text-[8px] text-cyan-400/80 mt-1 font-mono">↳ See 3D markers on the heart model for catheter placement</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-auto p-2 bg-slate-900/50 border border-slate-800 rounded-lg flex gap-1.5">
          <span className="text-[7.5px] text-slate-500 font-sans leading-relaxed">
            <strong>DISCLAIMER:</strong> AI-assisted decision support. Refer to specialist cardiologist for confirmatory diagnosis and treatment plan.
          </span>
        </div>
      </div>
    </div>
  )
}
