'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, useFBX, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle
} from 'lucide-react'

// ---------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------
interface SystemToggles {
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
  position: [number, number, number]
}

const ORGAN_SYSTEM_MAP: Record<string, keyof SystemToggles> = {
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

// Organ positions calibrated for Column 2 (organs exploded at dx = -1.2)
const ORGANS: BodyOrgan[] = [
  { id: 'brain', name: 'Brain', position: [-1.2, 3.05, 0] },
  { id: 'heart', name: 'Heart', position: [-1.28, 1.25, 0.08] },
  { id: 'lung_left', name: 'Left Lung', position: [-1.42, 1.3, 0.02] },
  { id: 'lung_right', name: 'Right Lung', position: [-0.98, 1.3, 0.02] },
  { id: 'liver', name: 'Liver', position: [-1.02, 0.55, 0.06] },
  { id: 'stomach', name: 'Stomach', position: [-1.36, 0.48, 0.08] },
  { id: 'kidney_left', name: 'Left Kidney', position: [-1.38, 0.1, -0.1] },
  { id: 'kidney_right', name: 'Right Kidney', position: [-1.02, 0.1, -0.1] },
  { id: 'intestines', name: 'Intestines', position: [-1.2, -0.6, 0.04] },
]

const ORGAN_MAP: Record<string, string[]> = {
  'heart': ['heart'],
  'lungs': ['lung_left', 'lung_right'],
  'brain': ['brain'],
  'liver': ['liver'],
  'kidneys': ['kidney_left', 'kidney_right'],
  'stomach': ['stomach'],
  'intestines': ['intestines'],
  'throat': ['throat'],
  'trachea': ['trachea'],
}

// Vertical offset for exploded organ view
const getOrganVerticalOffset = (nodeName: string, materialNames: string[]): number => {
  const name = nodeName.toLowerCase()
  if (name.includes('brain') || name.includes('cerebr')) return 0.7
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
// Pulsing Marker for affected organs
// ---------------------------------------------------------
function PulsingMarker({ position, organName, isHighlighted, condition, reasoning }: {
  position: [number, number, number]
  organName: string
  isHighlighted: boolean
  condition?: string
  reasoning?: string
}) {
  const markerRef = useRef<THREE.Mesh>(null)
  const color = isHighlighted ? '#ef4444' : '#22d3ee'

  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * 8) * 0.15
      markerRef.current.scale.set(scale, scale, scale)
    }
  })

  const isRight = position[0] >= -1.2
  const lineLen = isRight ? 0.7 : -0.7
  const labelOffset: [number, number, number] = [lineLen, 0.15, 0]

  return (
    <group position={position}>
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHighlighted ? 3.0 : 1.0} transparent opacity={0.95} />
      </mesh>
      <Line points={[[0, 0, 0], labelOffset]} color={color} lineWidth={1.5} />
      <Html distanceFactor={5} position={labelOffset} zIndexRange={[100, 0]}>
        <div className={`pointer-events-none transition-all duration-300 shadow-lg ${
          isHighlighted
            ? 'w-52 p-2.5 rounded bg-black/95 border border-red-500/60 text-white'
            : 'px-2 py-0.5 rounded bg-black/80 border border-cyan-700/40 text-cyan-300'
        }`} style={isHighlighted ? { boxShadow: '0 0 15px rgba(239,68,68,0.4)' } : {}}>
          {isHighlighted ? (
            <>
              <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                <span className="font-mono text-[8px] tracking-widest text-gray-400 uppercase">SYMPTOM MAPPING</span>
                <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">HIGH</span>
              </div>
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-white">{organName}</h3>
              {condition && <div className="font-semibold text-[10px] leading-tight mt-0.5 text-red-400">{condition}</div>}
              {reasoning && <p className="text-[9px] text-gray-400 leading-snug mt-1 border-t border-white/5 pt-1 line-clamp-3 font-sans">{reasoning}</p>}
            </>
          ) : (
            <span className="font-mono text-[9px] font-bold uppercase whitespace-nowrap">{organName}</span>
          )}
        </div>
      </Html>
    </group>
  )
}

// ---------------------------------------------------------
// GLTF Model (preserves original colors)
// ---------------------------------------------------------
function RealisticGLTFModel({
  path, positionX, activeSystems, highlightedMeshNames
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]
}) {
  const { scene } = useGLTF(path)

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)

    if (path.includes('splanchnology')) {
      if (positionX === -1.2) {
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          const name = child.name.toLowerCase()
          if (name.includes('skin') || name.includes('bone') || name.includes('skull')) toRemove.push(child)
        })
        toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
      } else if (positionX === -2.4) {
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const name = child.name.toLowerCase()
            const isSkin = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
            if (!isSkin) toRemove.push(child)
          }
        })
        toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
        const sketchfabModel = clone.getObjectByName('Sketchfab_model')
        if (sketchfabModel) sketchfabModel.rotation.set(0, 0, 0)
      }
    }

    if (path.includes('myology') || path.includes('scene')) {
      const sketchfabModel = clone.getObjectByName('Sketchfab_model')
      if (sketchfabModel) sketchfabModel.rotation.set(-Math.PI / 2, 0, 0)
      else clone.rotation.x = -Math.PI / 2
    }

    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        if (name.includes('floor') || name.includes('ground') || name.includes('plane') || name.includes('grid') || name.includes('helper')) return
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
          const meshBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld)
          if (!hasMesh) { box.copy(meshBox); hasMesh = true } else box.union(meshBox)
        }
      }
    })
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    clone.scale.setScalar(scaleFactor)
    clone.position.set(positionX - center.x * scaleFactor, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

    // Explode organs vertically for Column 2
    if (positionX === -1.2 && path.includes('splanchnology')) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh || (child as any).isMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
          const offset = getOrganVerticalOffset(child.name.toLowerCase(), matNames)
          if (offset !== 0) child.position.y += offset / scaleFactor
        }
      })
    }

    // Clone materials so we can modify them independently
    clone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m: any) => m.clone ? m.clone() : m)
          else if (mesh.material.clone) mesh.material = mesh.material.clone()
        }
      }
    })

    return clone
  }, [scene, positionX, path])

  // Apply visibility, keep original colors, only add emissive highlights
  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      const name = child.name.toLowerCase()
      let visible = true

      if (path.includes('splanchnology')) {
        const isSkinMesh = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
        const isBrainMesh = name.includes('brain') || name.includes('cerebr')
        const isHeartMesh = name.includes('heart') || name.includes('atrium') || name.includes('ventricle')
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        const isRespiratory = matNames.some((n: any) => n.includes('lung') || n.includes('bronchi') || n.includes('trachea'))
        const isDigestive = matNames.some((n: any) => n.includes('intestine') || n.includes('stomach') || n.includes('liver') || n.includes('kidney')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')

        if (positionX === -2.4) {
          visible = isSkinMesh && activeSystems.integumentary
        } else if (positionX === -1.2) {
          if (isSkinMesh) visible = false
          else {
            visible = true
            if (isBrainMesh && !activeSystems.nervous) visible = false
            if (isHeartMesh && !activeSystems.cardiovascular) visible = false
            if (isRespiratory && !activeSystems.respiratory) visible = false
            if (isDigestive && !activeSystems.digestive) visible = false
          }
        }
      } else if (path.includes('scene')) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        const isVessels = matNames.some((n: any) => n.includes('artery') || n.includes('vein'))
        if (positionX === 1.2) visible = isVessels && activeSystems.cardiovascular
      } else if (path.includes('myology')) {
        if (positionX === 2.4) {
          const isMuscular = name.includes('muscular') || name.includes('muscle')
          visible = isMuscular && activeSystems.muscular
        }
      }

      mesh.visible = visible

      // KEEP ORIGINAL COLORS — only touch emissive for highlights
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return

        // Skin column: full opacity, original texture
        const isSkin = name.includes('skin') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('hair')
        if (isSkin && positionX === -2.4) {
          m.transparent = false
          m.opacity = 1.0
          m.wireframe = false
          m.depthWrite = true
        } else {
          m.transparent = true
          m.opacity = 0.92
          m.wireframe = false
        }

        // Emissive highlight for symptom-affected meshes
        if (m.emissive) {
          m.emissive.set('#000000')
          m.emissiveIntensity = 0.0
        }
        if (highlightedMeshNames.length > 0) {
          const isHighlighted = highlightedMeshNames.some(reg => name.includes(reg))
          if (isHighlighted && m.emissive) {
            m.emissive.set('#ff3333')
            m.emissiveIntensity = 2.0
          }
        }
        m.needsUpdate = true
      })
    })
  }, [cloned, activeSystems, highlightedMeshNames, positionX, path])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// FBX Model (Skeletal) — preserves original colors
// ---------------------------------------------------------
function RealisticFBXModel({
  path, positionX, activeSystems, highlightedMeshNames
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]
}) {
  const fbx = useFBX(path)

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(fbx)
    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        if (name.includes('floor') || name.includes('ground') || name.includes('plane') || name.includes('grid') || name.includes('helper')) return
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
          const meshBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld)
          if (!hasMesh) { box.copy(meshBox); hasMesh = true } else box.union(meshBox)
        }
      }
    })
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    clone.scale.setScalar(scaleFactor)
    clone.position.set(positionX - center.x * scaleFactor, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

    clone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (!mesh.isSkinnedMesh && mesh.geometry) {
          if (mesh.geometry.attributes.skinIndex) mesh.geometry.deleteAttribute('skinIndex')
          if (mesh.geometry.attributes.skinWeight) mesh.geometry.deleteAttribute('skinWeight')
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m: any) => m.clone ? m.clone() : m)
          else if (mesh.material.clone) mesh.material = mesh.material.clone()
        }
      }
    })
    return clone
  }, [fbx, positionX])

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      mesh.visible = activeSystems.skeletal
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        m.transparent = true
        m.opacity = 0.92
        m.wireframe = false
        // Keep original bone colors — only touch emissive
        if (m.emissive) {
          m.emissive.set('#000000')
          m.emissiveIntensity = 0.0
        }
        m.needsUpdate = true
      })
    })
  }, [cloned, activeSystems, highlightedMeshNames])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------
export default function ViewAnatomyPage() {
  const [age, setAge] = useState(38)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState('severe pain lower right abdomen, fever, nausea')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [redFlag, setRedFlag] = useState(false)
  const [highlightedMeshNames, setHighlightedMeshNames] = useState<string[]>([])
  const [affectedOrganIds, setAffectedOrganIds] = useState<string[]>([])
  const [conditionsByOrgan, setConditionsByOrgan] = useState<Record<string, { condition: string; reasoning: string }>>({})

  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true, muscular: true, nervous: false, cardiovascular: true,
    respiratory: true, digestive: true, lymphatic: false, integumentary: true
  })

  // Show initial stub on load
  useEffect(() => {
    setPossibleConditions([
      { name: 'Acute Appendicitis', confidence: 92, reasoning: 'Localized RLQ tenderness, periumbilical pain migration, nausea, and low-grade pyrexia match clinical appendicitis.' }
    ])
    setRedFlag(true)
    setHighlightedMeshNames(['intestine', 'stomach'])
    setAffectedOrganIds(['intestines', 'stomach'])
    setConditionsByOrgan({
      'intestines': { condition: 'Acute Appendicitis', reasoning: 'Periumbilical pain migrating to RLQ with McBurney point tenderness.' },
      'stomach': { condition: 'Gastric Irritation', reasoning: 'Secondary nausea and vomiting from visceral peritoneal stimulation.' }
    })
  }, [])

  const handleAnalyze = async () => {
    if (!symptomsInput.trim()) return
    setIsLoading(true)
    setErrorMsg(null)
    setPossibleConditions([])
    setRedFlag(false)
    setHighlightedMeshNames([])
    setAffectedOrganIds([])
    setConditionsByOrgan({})

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, sex, duration, severity, symptoms: symptomsInput })
      })
      if (!response.ok) throw new Error('API server error.')
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setPossibleConditions(data.possibleConditions || [])
      setRedFlag(!!data.redFlag)

      // Build mesh-name highlights and organ id mappings
      const meshNames: string[] = []
      const organIds: string[] = []
      const organConditions: Record<string, { condition: string; reasoning: string }> = {}
      ;(data.affectedRegions || []).forEach((r: string) => {
        const key = r.toLowerCase()
        // Map region name to organ IDs
        const mapped = ORGAN_MAP[key]
        if (mapped) mapped.forEach(id => organIds.push(id))
        else organIds.push(key)

        // Map region to mesh search names
        if (key === 'heart') meshNames.push('heart', 'atrium', 'ventricle')
        else if (key === 'lungs') meshNames.push('lung')
        else if (key === 'brain') meshNames.push('brain', 'cerebr')
        else if (key === 'liver') meshNames.push('liver')
        else if (key === 'stomach') meshNames.push('stomach')
        else if (key === 'intestines') meshNames.push('intestine')
        else if (key === 'kidneys') meshNames.push('kidney')
        else if (key === 'trachea') meshNames.push('trachea')
        else meshNames.push(key)

        // Associate first condition with each organ
        const cond = data.possibleConditions?.[0]
        if (cond) {
          const ids = ORGAN_MAP[key] || [key]
          ids.forEach((id: string) => {
            organConditions[id] = { condition: cond.name, reasoning: cond.reasoning }
          })
        }
      })
      setHighlightedMeshNames(meshNames)
      setAffectedOrganIds(organIds)
      setConditionsByOrgan(organConditions)

    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Connection failure.')
      setPossibleConditions([{ name: 'Fallback GI Distress', confidence: 70, reasoning: 'Generic fallback.' }])
      setHighlightedMeshNames(['stomach', 'intestine'])
      setAffectedOrganIds(['stomach', 'intestines'])
      setConditionsByOrgan({
        'stomach': { condition: 'Fallback', reasoning: 'API unavailable.' },
        'intestines': { condition: 'Fallback', reasoning: 'API unavailable.' }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => setSystems(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="w-full h-screen bg-[#1a1a2e] text-gray-100 flex flex-col font-mono text-xs select-none overflow-hidden relative">
      
      {/* HEADER */}
      <div className="bg-[#16213e]/90 border-b border-slate-700/60 px-4 py-3 z-10 flex justify-between items-center backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/scan" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700 transition text-[10px] font-bold text-gray-300">
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-slate-700/40"></div>
          <div>
            <h1 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> 
              Realistic 3D Anatomy Viewer & Symptom Mapper
            </h1>
            <p className="text-[9px] text-slate-400 mt-0.5">Original model colors preserved. Enter symptoms to highlight affected regions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 font-bold uppercase">● ABDM SECURE</span>
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/25 text-blue-400 font-bold uppercase">DEEPSEEK R1</span>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">

        {/* LEFT: Patient Symptom Input */}
        <div className="w-[22%] bg-[#16213e]/50 border-r border-slate-700/40 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          <div className="space-y-4">
            <span className="font-bold text-[11px] uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-slate-700/30 pb-2">
              📋 Patient Symptom Input
            </span>
            <div className="space-y-3 text-[10px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[9px]">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-[#0f3460]/40 border border-slate-600/50 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[9px]">Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-[#0f3460]/40 border border-slate-600/50 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px]">Symptom Duration</label>
                <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3 days"
                  className="w-full bg-[#0f3460]/40 border border-slate-600/50 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px]">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-[#0f3460]/40 border border-slate-600/50 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px]">Symptoms</label>
                <textarea rows={5} value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Describe symptoms here..."
                  className="w-full bg-[#0f3460]/40 border border-slate-600/50 rounded p-2.5 text-white outline-none focus:border-cyan-500/40 text-xs resize-none leading-relaxed" />
              </div>
            </div>
          </div>

          <button onClick={handleAnalyze} disabled={isLoading || !symptomsInput.trim()}
            className="w-full mt-4 py-2.5 bg-cyan-900/60 hover:bg-cyan-800/60 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40">
            {isLoading ? (
              <><span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span> ANALYZING...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Analyze & Map</>
            )}
          </button>

          <div className="mt-3 p-2 bg-slate-900/60 border border-slate-700/40 rounded-lg leading-relaxed flex items-start gap-1.5 text-slate-400 font-sans text-[9px]">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span><strong>AI-generated decision support</strong> — not a diagnosis. Requires clinical verification.</span>
          </div>
        </div>

        {/* CENTER: 3D Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Layer controls */}
          <div className="bg-[#16213e]/60 border-b border-slate-700/40 px-4 py-2 flex flex-wrap gap-2 text-[9px] items-center z-10 shrink-0">
            <span className="text-slate-400 font-bold uppercase tracking-wider mr-2">Layers:</span>
            {[
              { label: 'Skin', key: 'integumentary' },
              { label: 'Skeleton', key: 'skeletal' },
              { label: 'Muscles', key: 'muscular' },
              { label: 'Organs', key: 'digestive' },
              { label: 'Vessels', key: 'cardiovascular' },
            ].map(sys => {
              const isActive = (systems as any)[sys.key]
              return (
                <button key={sys.key} onClick={() => toggleSystem(sys.key as any)}
                  className={`px-2 py-1 rounded transition-all cursor-pointer border ${
                    isActive ? 'bg-cyan-900/40 border-cyan-500/35 text-cyan-400 font-bold' : 'bg-slate-800/35 border-slate-700/20 text-slate-500'
                  }`}>
                  {sys.label}
                </button>
              )
            })}
          </div>

          {/* 3D Canvas with NEUTRAL STUDIO LIGHTING */}
          <div className="flex-1 relative">
            <Canvas camera={{ position: [0, 0.2, 4.6], fov: 50 }} style={{ position: 'absolute', inset: 0 }}>
              <color attach="background" args={['#1a1a2e']} />

              {/* Neutral white studio lighting — no cyan/blue tinting */}
              <ambientLight intensity={0.7} color="#ffffff" />
              <directionalLight position={[10, 15, 5]} intensity={1.8} color="#ffffff" castShadow />
              <directionalLight position={[-10, 10, -5]} intensity={1.0} color="#e8e0d8" />
              <spotLight position={[0, 12, 0]} intensity={2.5} angle={0.6} penumbra={1} color="#ffffff" />
              <spotLight position={[0, -5, 5]} intensity={1.0} angle={0.8} penumbra={1} color="#f5f0eb" />

              {/* Per-column warm fill lights */}
              <spotLight position={[-2.4, 5, 3]} intensity={1.8} distance={8} color="#ffffff" />
              <spotLight position={[-1.2, 5, 3]} intensity={1.8} distance={8} color="#ffffff" />
              <spotLight position={[0.0, 5, 3]} intensity={2.0} distance={8} color="#ffffff" />
              <spotLight position={[1.2, 5, 3]} intensity={1.8} distance={8} color="#ffffff" />
              <spotLight position={[2.4, 5, 3]} intensity={1.8} distance={8} color="#ffffff" />

              <Suspense fallback={null}>
                {/* Column 1: Body Skin/Integumentary */}
                <Suspense fallback={null}>
                  <RealisticGLTFModel path="/ai-in-healthcare/asset-01/splanchnology.glb" positionX={-2.4} activeSystems={systems} highlightedMeshNames={highlightedMeshNames} />
                </Suspense>
                {/* Column 2: Visceral Organs (exploded) */}
                <Suspense fallback={null}>
                  <RealisticGLTFModel path="/ai-in-healthcare/asset-01/splanchnology.glb" positionX={-1.2} activeSystems={systems} highlightedMeshNames={highlightedMeshNames} />
                </Suspense>
                {/* Column 3: Skeletal (FBX) */}
                <Suspense fallback={null}>
                  <RealisticFBXModel path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" positionX={0.0} activeSystems={systems} highlightedMeshNames={highlightedMeshNames} />
                </Suspense>
                {/* Column 4: Cardiovascular */}
                <Suspense fallback={null}>
                  <RealisticGLTFModel path="/ai-in-healthcare/asset-01/scene.gltf" positionX={1.2} activeSystems={systems} highlightedMeshNames={highlightedMeshNames} />
                </Suspense>
                {/* Column 5: Muscular */}
                <Suspense fallback={null}>
                  <RealisticGLTFModel path="/ai-in-healthcare/asset-01/myology.glb" positionX={2.4} activeSystems={systems} highlightedMeshNames={highlightedMeshNames} />
                </Suspense>
              </Suspense>

              {/* Organ labels / symptom mapping markers on Column 2 */}
              {ORGANS.map(organ => {
                const systemKey = ORGAN_SYSTEM_MAP[organ.id]
                const isSystemActive = !systemKey || !!systems[systemKey]
                if (!isSystemActive) return null

                const isAffected = affectedOrganIds.includes(organ.id)
                const organCond = conditionsByOrgan[organ.id]

                return (
                  <PulsingMarker
                    key={organ.id}
                    position={organ.position}
                    organName={organ.name}
                    isHighlighted={isAffected}
                    condition={organCond?.condition}
                    reasoning={organCond?.reasoning}
                  />
                )
              })}

              {/* Subtle dark grid */}
              <gridHelper args={[8.0, 20, '#334155', '#1e293b']} position={[0, -0.99, 0]} />
              <ContactShadows position={[0, -1.0, 0]} opacity={0.6} scale={7} blur={3} far={4} color="#000000" />
              <OrbitControls enablePan minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.3} minDistance={1.0} maxDistance={8} target={[0, 0, 0]} />
            </Canvas>
          </div>
        </div>

        {/* RIGHT: Diagnosis Results */}
        <div className="w-[25%] bg-[#16213e]/50 border-l border-slate-700/40 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          <div className="space-y-4">
            <span className="font-bold text-[11px] uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-slate-700/30 pb-2">
              🔬 AI Diagnostics Dossier
            </span>

            {errorMsg && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 text-[10px] flex items-start gap-1.5 leading-snug animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}

            {redFlag && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2 animate-pulse leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠️ Urgent findings — clinical correlation required.</span>
              </div>
            )}

            {affectedOrganIds.length > 0 && (
              <div className="p-2.5 bg-slate-900/50 border border-slate-700/40 rounded-lg">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1.5">Mapped Body Regions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {affectedOrganIds.map((id, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-300 text-[9px] font-bold uppercase">{id.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Possible Conditions:</span>
              {possibleConditions.length > 0 ? possibleConditions.map((cond, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 border border-slate-700/40 rounded-xl space-y-1.5 hover:border-cyan-500/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-rose-400 text-[11px] uppercase tracking-wide truncate max-w-[150px]">{cond.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold shrink-0">{cond.confidence}%</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal font-sans">{cond.reasoning}</p>
                </div>
              )) : (
                <div className="p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-center text-[10px]">Submit symptoms to generate diagnosis.</div>
              )}
            </div>
          </div>

          <div className="mt-6 p-2 bg-slate-900/60 border border-slate-700/40 rounded-lg leading-relaxed flex items-start gap-1.5 text-slate-400 font-sans text-[9px]">
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
            <span>AI-generated. Not a clinical diagnosis. Requires professional medical validation.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
