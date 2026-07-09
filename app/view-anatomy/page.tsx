'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, useFBX, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle, RefreshCw, CheckSquare
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

// Clean local coordinates of standard organs centered around (0,0,0)
const ORGANS: BodyOrgan[] = [
  { id: 'brain', name: 'Brain', position: [0, 2.35, 0] },
  { id: 'throat', name: 'Throat', position: [0, 1.75, 0.02] },
  { id: 'nasal_cavity', name: 'Nasal Cavity', position: [0, 2.1, 0.12] },
  { id: 'trachea', name: 'Trachea', position: [0, 1.4, 0.02] },
  { id: 'lung_left', name: 'Left Lung', position: [-0.22, 1.0, 0.02] },
  { id: 'lung_right', name: 'Right Lung', position: [0.22, 1.0, 0.02] },
  { id: 'heart', name: 'Heart', position: [-0.08, 0.95, 0.08] },
  { id: 'liver', name: 'Liver', position: [0.18, 0.55, 0.06] },
  { id: 'stomach', name: 'Stomach', position: [-0.16, 0.48, 0.08] },
  { id: 'kidney_left', name: 'Left Kidney', position: [-0.18, 0.5, -0.1] },
  { id: 'kidney_right', name: 'Right Kidney', position: [0.18, 0.5, -0.1] },
  { id: 'intestines', name: 'Intestines', position: [0, 0.1, 0.04] },
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

// Vertical offset for exploded organ view in Split View mode
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
// Clean Legible Pointer Callout Card for clinician mapping
// ---------------------------------------------------------
function PulsingCallout({ position, organName, isAffected, condition, reasoning, severity }: {
  position: [number, number, number]
  organName: string
  isAffected: boolean
  condition?: string
  reasoning?: string
  severity?: string
}) {
  const markerRef = useRef<THREE.Mesh>(null)
  const color = isAffected ? '#ef4444' : '#0ea5e9'

  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * 8) * 0.15
      markerRef.current.scale.set(scale, scale, scale)
    }
  })

  // Determine direction to draw callout card to avoid layout overlap
  const isRight = position[0] >= 0
  const lineLen = isRight ? 0.65 : -0.65
  const labelOffset: [number, number, number] = [lineLen, 0.15, 0]

  // Severity Triage Colors
  const severityBadgeClass = 
    severity?.toUpperCase() === 'CRITICAL' || severity?.toUpperCase() === 'HIGH'
      ? 'bg-red-100 text-red-700 border-red-200'
      : severity?.toUpperCase() === 'MEDIUM'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200'

  return (
    <group position={position}>
      {/* Pulsing Core anchor point */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isAffected ? 2.0 : 0.2} transparent opacity={0.9} />
      </mesh>
      
      {/* Thin line pointer callout connector */}
      <Line points={[[0, 0, 0], labelOffset]} color={color} lineWidth={1.2} />
      
      {/* Clean Light-Themed Callout Card */}
      <Html distanceFactor={5} position={labelOffset} zIndexRange={[100, 0]}>
        <div className={`pointer-events-none transition-all duration-300 shadow-md p-3 rounded-lg border font-sans ${
          isAffected
            ? 'w-56 bg-white/95 border-red-500/60 text-slate-800 shadow-[0_4px_16px_rgba(239,68,68,0.12)]'
            : 'px-2.5 py-1 rounded-md bg-white border-slate-200 text-slate-600 text-[9px] font-semibold whitespace-nowrap'
        }`}>
          {isAffected ? (
            <div className="flex flex-col gap-1 text-[10px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1 mb-1 font-mono">
                <span className="text-[8px] tracking-wider text-slate-400 uppercase font-bold">Clinical Mapping</span>
                {severity && (
                  <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border uppercase ${severityBadgeClass}`}>
                    {severity}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[11px] text-slate-900 uppercase">{organName}</h3>
              {condition && <div className="font-bold text-[10px] text-red-600 mt-0.5">{condition}</div>}
              {reasoning && <p className="text-[9.5px] text-slate-500 leading-snug mt-1 font-sans border-t border-slate-50 pt-1 font-medium">{reasoning}</p>}
            </div>
          ) : (
            <span className="font-mono text-[9px] font-bold uppercase">{organName}</span>
          )}
        </div>
      </Html>
    </group>
  )
}

// ---------------------------------------------------------
// GLTF Model Component (Preserves Embedded Textures/Colors)
// ---------------------------------------------------------
function RealisticGLTFModel({
  path, positionX, activeSystems, highlightedMeshNames, viewMode, visible
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]; viewMode: 'split' | 'single'; visible: boolean
}) {
  const { scene } = useGLTF(path)

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)

    if (path.includes('splanchnology')) {
      if (positionX === -1.2) {
        // Exploded visceral organs (remove skin/bone elements)
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          const name = child.name.toLowerCase()
          if (name.includes('skin') || name.includes('bone') || name.includes('skull')) toRemove.push(child)
        })
        toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
      } else if (positionX === -2.4) {
        // Skin outer shell mesh only
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
    
    // Position depends on Split vs Single view mode
    const finalPosX = viewMode === 'split' ? positionX : 0.0
    clone.position.set(finalPosX - center.x * scaleFactor, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

    // Apply vertical explosion for organs in Column 2 (only in Split View)
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh || (child as any).isMesh) {
        const name = child.name.toLowerCase()
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        
        // Explode only column 2 organs and only in split mode
        const isColumn2Organ = positionX === -1.2 && path.includes('splanchnology')
        if (isColumn2Organ) {
          const offset = getOrganVerticalOffset(name, matNames)
          if (offset !== 0) {
            // Store original y in userData so we can restore or apply offsets dynamically
            child.userData.originalY = child.userData.originalY ?? child.position.y
            child.userData.offsetY = offset / scaleFactor
          }
        }
      }
    })

    // Clone materials so we can modify highlight attributes dynamically
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

  // Apply visibility, positions, and handle highlights dynamically (fast toggles)
  useEffect(() => {
    // Dynamically adjust root position depending on split vs single view
    const finalPosX = viewMode === 'split' ? positionX : 0.0
    cloned.position.x = finalPosX - (new THREE.Box3().setFromObject(cloned).getCenter(new THREE.Vector3()).x - cloned.position.x)

    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      const name = child.name.toLowerCase()
      
      // 1. FAST TOGGLING: Hide meshes instantly if this column isn't checked
      if (!visible) {
        mesh.visible = false
        return
      }

      let meshVisible = true

      if (path.includes('splanchnology')) {
        const isSkinMesh = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
        const isBrainMesh = name.includes('brain') || name.includes('cerebr')
        const isHeartMesh = name.includes('heart') || name.includes('atrium') || name.includes('ventricle')
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        const isRespiratory = matNames.some((n: any) => n.includes('lung') || n.includes('bronchi') || n.includes('trachea'))
        const isDigestive = matNames.some((n: any) => n.includes('intestine') || n.includes('stomach') || n.includes('liver') || n.includes('kidney')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')

        if (viewMode === 'split') {
          if (positionX === -2.4) {
            meshVisible = isSkinMesh && activeSystems.integumentary
          } else if (positionX === -1.2) {
            if (isSkinMesh) meshVisible = false
            else {
              meshVisible = true
              if (isBrainMesh && !activeSystems.nervous) meshVisible = false
              if (isHeartMesh && !activeSystems.cardiovascular) meshVisible = false
              if (isRespiratory && !activeSystems.respiratory) meshVisible = false
              if (isDigestive && !activeSystems.digestive) meshVisible = false
            }
          }
        } else {
          // Single View mode overlay logic
          if (isSkinMesh) {
            meshVisible = activeSystems.integumentary
          } else {
            meshVisible = false
            if (isBrainMesh && activeSystems.nervous) meshVisible = true
            if (isHeartMesh && activeSystems.cardiovascular) meshVisible = true
            if (isRespiratory && activeSystems.respiratory) meshVisible = true
            if (isDigestive && activeSystems.digestive) meshVisible = true
          }
        }
      } else if (path.includes('scene')) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        const isVessels = matNames.some((n: any) => n.includes('artery') || n.includes('vein'))
        meshVisible = isVessels && activeSystems.cardiovascular
      } else if (path.includes('myology')) {
        // MUSCULAR VIEW FIXED: no name includes filtering because myology GLB nodes are Object_X
        meshVisible = activeSystems.muscular
      }

      mesh.visible = meshVisible

      // Apply vertical explosion dynamically only in split mode
      if (positionX === -1.2 && path.includes('splanchnology')) {
        if (child.userData.offsetY !== undefined) {
          const originalY = child.userData.originalY ?? child.position.y
          child.position.y = viewMode === 'split' ? originalY + child.userData.offsetY : originalY
        }
      }

      // Apply clinical translucent/solid opacities while retaining embedded colors
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        const isSkin = name.includes('skin') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('hair')
        
        if (isSkin) {
          m.transparent = true
          // Semi-translucent in Single View to view internal organs, solid in split skin view
          m.opacity = viewMode === 'single' ? 0.18 : 1.0
          m.wireframe = false
          m.depthWrite = viewMode !== 'single'
        } else {
          m.transparent = true
          m.opacity = 0.9
          m.wireframe = false
        }

        // Emissive highlights
        if (m.emissive) {
          m.emissive.set('#000000')
          m.emissiveIntensity = 0.0
        }
        if (highlightedMeshNames.length > 0) {
          const isHighlighted = highlightedMeshNames.some(reg => name.includes(reg))
          if (isHighlighted && m.emissive) {
            m.emissive.set('#ef4444')
            m.emissiveIntensity = 2.0
          }
        }
        m.needsUpdate = true
      })
    })
  }, [cloned, activeSystems, highlightedMeshNames, positionX, path, viewMode, visible])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// FBX Model (Skeletal) Component (Preserves Original Colors)
// ---------------------------------------------------------
function RealisticFBXModel({
  path, positionX, activeSystems, highlightedMeshNames, viewMode, visible
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]; viewMode: 'split' | 'single'; visible: boolean
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
    
    // Position depends on Split vs Single view mode
    const finalPosX = viewMode === 'split' ? positionX : 0.0
    clone.position.set(finalPosX - center.x * scaleFactor, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

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
    // Dynamically adjust root position depending on split vs single view
    const finalPosX = viewMode === 'split' ? positionX : 0.0
    cloned.position.x = finalPosX - (new THREE.Box3().setFromObject(cloned).getCenter(new THREE.Vector3()).x - cloned.position.x)

    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      
      // 1. FAST TOGGLING: Hide meshes instantly if skeletal system isn't checked
      if (!visible) {
        mesh.visible = false
        return
      }

      mesh.visible = activeSystems.skeletal
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        m.transparent = true
        m.opacity = 0.92
        m.wireframe = false
        if (m.emissive) {
          m.emissive.set('#000000')
          m.emissiveIntensity = 0.0
        }
        m.needsUpdate = true
      })
    })
  }, [cloned, activeSystems, highlightedMeshNames, viewMode, positionX, visible])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// View Anatomy Page
// ---------------------------------------------------------
export default function ViewAnatomyPage() {
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split')
  
  // Patient symptom input fields
  const [age, setAge] = useState<number>(38)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState<string>('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState<string>('')

  // Analysis result states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [redFlag, setRedFlag] = useState<boolean>(false)
  const [highlightedMeshNames, setHighlightedMeshNames] = useState<string[]>([])
  
  // Clinically mapped organs matching active symptom analysis
  const [affectedOrganIds, setAffectedOrganIds] = useState<string[]>([])
  const [conditionsByOrgan, setConditionsByOrgan] = useState<Record<string, { condition: string; reasoning: string; severity: string }>>({})

  // 3D layers toggles
  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true,
    muscular: true,
    nervous: false,
    cardiovascular: true,
    respiratory: true,
    digestive: true,
    lymphatic: false,
    integumentary: true
  })

  // Clear/Reset symptoms and model state
  const handleClear = () => {
    setSymptomsInput('')
    setPossibleConditions([])
    setRedFlag(false)
    setHighlightedMeshNames([])
    setAffectedOrganIds([])
    setConditionsByOrgan({})
    setErrorMsg(null)
  }

  // Handle clinical analysis
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

      // Map regions to mesh strings and organ IDs
      const meshNames: string[] = []
      const organIds: string[] = []
      const organConditions: Record<string, { condition: string; reasoning: string; severity: string }> = {}

      ;(data.affectedRegions || []).forEach((r: string) => {
        const key = r.toLowerCase()
        const mapped = ORGAN_MAP[key]
        if (mapped) mapped.forEach(id => organIds.push(id))
        else organIds.push(key)

        if (key === 'heart') meshNames.push('heart', 'atrium', 'ventricle')
        else if (key === 'lungs') meshNames.push('lung')
        else if (key === 'brain') meshNames.push('brain', 'cerebr')
        else if (key === 'liver') meshNames.push('liver')
        else if (key === 'stomach') meshNames.push('stomach')
        else if (key === 'intestines') meshNames.push('intestine')
        else if (key === 'kidneys') meshNames.push('kidney')
        else if (key === 'trachea') meshNames.push('trachea')
        else meshNames.push(key)

        const cond = data.possibleConditions?.[0]
        if (cond) {
          const ids = ORGAN_MAP[key] || [key]
          ids.forEach((id: string) => {
            organConditions[id] = { 
              condition: cond.name, 
              reasoning: cond.reasoning,
              severity: severity
            }
          })
        }
      })

      setHighlightedMeshNames(meshNames)
      setAffectedOrganIds(organIds)
      setConditionsByOrgan(organConditions)

    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Connection failure. Running fallback stub.')
      // Graceful fallback
      setPossibleConditions([
        { name: 'Transient GI Distress (Fallback)', confidence: 70, reasoning: 'GI inflammation fallback due to API endpoint delay.' }
      ])
      setHighlightedMeshNames(['stomach', 'intestine'])
      setAffectedOrganIds(['stomach', 'intestines'])
      setConditionsByOrgan({
        'stomach': { condition: 'Gastric Irritation', reasoning: 'Secondary vomiting secondary to peritoneal stimulation.', severity: severity },
        'intestines': { condition: 'Acute Appendicitis', reasoning: 'Migrating RLQ tenderness and abdominal guarding.', severity: severity }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-mono text-xs select-none overflow-hidden relative">
      
      {/* HEADER: Clean White Clinical Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 z-10 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/scan" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition text-[10px] font-bold text-slate-600 pointer-events-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" /> 
              Interactive 3D Anatomy & Clinical Triage Viewer
            </h1>
            <p className="text-[9px] text-slate-400 mt-0.5 font-sans font-medium">Physically based medical models. Search symptoms to isolate pathology.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Split vs Single view toggle tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Split View
            </button>
            <button 
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Single View
            </button>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-1"></div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase text-[9px]">● ABDM SECURE</span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">

        {/* LEFT COLUMN: Patient Symptom Input (22% Width, Light Clinical Styling) */}
        <div className="w-[22%] bg-white border-r border-slate-200 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              📋 Patient Symptom Input
            </span>

            <div className="space-y-3.5 text-[10px]">
              {/* Age & Sex */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[9px] font-bold">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[9px] font-bold">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Symptom Duration */}
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px] font-bold">Symptom Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, 2 weeks"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Severity Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px] font-bold">Clinical Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="Low">Low (Triage Green)</option>
                  <option value="Medium">Medium (Triage Yellow)</option>
                  <option value="High">High (Triage Orange)</option>
                  <option value="Critical">Critical (Triage Red)</option>
                </select>
              </div>

              {/* Free-text Symptoms Area */}
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[9px] font-bold">Symptoms Description</label>
                <textarea
                  rows={6}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Describe patient symptoms here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs resize-none leading-relaxed custom-scrollbar font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 shrink-0">
            <button
              onClick={handleClear}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 font-bold uppercase transition flex items-center justify-center cursor-pointer shadow-sm"
              title="Clear Symptoms & Highlights"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !symptomsInput.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ANALYZING...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze & Map
                </>
              )}
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: 3D Visualization Viewport (53% Width) */}
        <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden relative">
          
          <div className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden relative flex flex-col shadow-sm">
            <div className="absolute top-4 left-4 z-10 bg-white/95 border border-slate-200 rounded px-2.5 py-1 text-[9px] text-slate-600 uppercase tracking-widest font-mono shadow-sm">
              🧬 {viewMode === 'split' ? 'Anatomical Split View (5 Columns)' : 'Centered Single Layer View'}
            </div>

            {/* CLINICIAN CHECKBOX SELECTOR: Floating card on Canvas */}
            <div className="absolute left-4 top-16 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-md flex flex-col gap-2 font-mono text-[9px] w-36">
              <span className="text-slate-400 font-bold block mb-1 text-[8.5px] border-b border-slate-100 pb-1 uppercase tracking-wider">Layers</span>
              {[
                { label: 'Skin', key: 'integumentary' },
                { label: 'Skeleton', key: 'skeletal' },
                { label: 'Muscles', key: 'muscular' },
                { label: 'Organs', key: 'digestive' },
                { label: 'Vessels', key: 'cardiovascular' },
                { label: 'Nerves', key: 'nervous' }
              ].map(sys => {
                const isActive = (systems as any)[sys.key]
                return (
                  <label key={sys.key} className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors font-medium">
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleSystem(sys.key as any)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer pointer-events-auto"
                    />
                    <span className={isActive ? 'text-blue-600 font-bold' : 'text-slate-500'}>{sys.label}</span>
                  </label>
                )
              })}
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full h-full relative z-0">
              <Canvas camera={{ position: [0, 0.2, 4.6], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
                {/* Clinical Light Gray Background */}
                <color attach="background" args={['#f1f5f9']} />
                
                {/* Neutral Studio Lighting */}
                <ambientLight intensity={0.7} color="#ffffff" />
                <directionalLight position={[10, 15, 5]} intensity={1.8} color="#ffffff" castShadow />
                <directionalLight position={[-10, 10, -5]} intensity={1.0} color="#e8e0d8" />
                <spotLight position={[0, 12, 0]} intensity={2.5} angle={0.6} penumbra={1} color="#ffffff" />
                <spotLight position={[0, -5, 5]} intensity={1.0} angle={0.8} penumbra={1} color="#f5f0eb" />

                {/* Light fill spotlights matching the 5 columns */}
                <spotLight position={[-2.4, 5, 3]} intensity={1.5} distance={8} color="#ffffff" />
                <spotLight position={[-1.2, 5, 3]} intensity={1.5} distance={8} color="#ffffff" />
                <spotLight position={[0.0, 5, 3]} intensity={1.8} distance={8} color="#ffffff" />
                <spotLight position={[1.2, 5, 3]} intensity={1.5} distance={8} color="#ffffff" />
                <spotLight position={[2.4, 5, 3]} intensity={1.5} distance={8} color="#ffffff" />

                <Suspense fallback={null}>
                  {/* Column 1: Body Skin/Integumentary */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/splanchnology.glb" 
                      positionX={-2.4} 
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={viewMode === 'split' ? systems.integumentary : systems.integumentary}
                    />
                  </Suspense>

                  {/* Column 2: Visceral Organs */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/splanchnology.glb" 
                      positionX={-1.2} 
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={viewMode === 'split' ? (systems.digestive || systems.respiratory) : (systems.digestive || systems.respiratory)}
                    />
                  </Suspense>
                  
                  {/* Column 3: Skeletal System (FBX) */}
                  <Suspense fallback={null}>
                    <RealisticFBXModel 
                      path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" 
                      positionX={0.0} 
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={viewMode === 'split' ? systems.skeletal : systems.skeletal}
                    />
                  </Suspense>

                  {/* Column 4: Cardiovascular vessels */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/scene.gltf" 
                      positionX={1.2} 
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={viewMode === 'split' ? systems.cardiovascular : systems.cardiovascular}
                    />
                  </Suspense>

                  {/* Column 5: Muscular system */}
                  <Suspense fallback={null}>
                    <RealisticGLTFModel 
                      path="/ai-in-healthcare/asset-01/myology.glb" 
                      positionX={2.4} 
                      activeSystems={systems}
                      highlightedMeshNames={highlightedMeshNames}
                      viewMode={viewMode}
                      visible={viewMode === 'split' ? systems.muscular : systems.muscular}
                    />
                  </Suspense>
                </Suspense>

                {/* Render interactive markers (only visible after analysis maps organs) */}
                {affectedOrganIds.length > 0 && ORGANS.map(organ => {
                  const systemKey = ORGAN_SYSTEM_MAP[organ.id]
                  const isSystemActive = !systemKey || !!systems[systemKey]
                  if (!isSystemActive) return null

                  const isAffected = affectedOrganIds.includes(organ.id)
                  if (!isAffected) return null // Hide non-affected markers

                  const organCond = conditionsByOrgan[organ.id]

                  // Adjust offsets dynamically based on the view mode (Split vs Single overlay)
                  const [bx, by, bz] = organ.position
                  const dx = viewMode === 'split' ? -1.2 : 0.0
                  let dy = 0
                  
                  if (viewMode === 'split') {
                    if (organ.id === 'brain') dy = 0.7
                    else if (['throat', 'nasal_cavity', 'trachea', 'lung_left', 'lung_right', 'heart'].includes(organ.id)) dy = 0.3
                    else if (['liver', 'stomach'].includes(organ.id)) dy = 0.0
                    else if (['kidney_left', 'kidney_right'].includes(organ.id)) dy = -0.4
                    else if (organ.id === 'intestines') dy = -0.7
                  }
                  
                  const adjustedPosition: [number, number, number] = [bx + dx, by + dy, bz]

                  return (
                    <PulsingCallout
                      key={`anomaly-${organ.id}`}
                      position={adjustedPosition}
                      organName={organ.name}
                      isAffected={isAffected}
                      condition={organCond?.condition}
                      reasoning={organCond?.reasoning}
                      severity={organCond?.severity}
                    />
                  )
                })}

                {/* Subtle slate grid helper on light background */}
                <gridHelper 
                  args={[8.0, 20, '#cbd5e1', '#e2e8f0']} 
                  position={[0, -0.99, 0]}
                />

                <ContactShadows 
                  position={[0, -1.0, 0]} 
                  opacity={0.5} 
                  scale={7} 
                  blur={3} 
                  far={4} 
                  color="#000000"
                />

                <OrbitControls
                  enablePan={true}
                  minPolarAngle={Math.PI / 6}
                  maxPolarAngle={Math.PI / 1.3}
                  minDistance={1.0}
                  maxDistance={8}
                  target={[0, 0, 0]}
                />
              </Canvas>
            </div>
          </div>
        </div>

        {/* 4. RIGHT COLUMN: Diagnosis results dossier (25% Width, Light Clinical Styling) */}
        <div className="w-[25%] bg-white border-l border-slate-200 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              🔬 AI Diagnostics dossier
            </span>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] flex items-start gap-1.5 leading-snug animate-pulse font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Red Flag Emergency Banner */}
            {redFlag && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2 animate-pulse leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>⚠️ Urgent findings — clinical correlation required.</span>
              </div>
            )}

            {/* Mapped regions pill summary */}
            {affectedOrganIds.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1.5 font-bold">Mapped Regions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(affectedOrganIds)).map((id, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold uppercase">
                      {id.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Conditions Cards */}
            <div className="space-y-3">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Possible Conditions:</span>
              
              {possibleConditions.length > 0 ? (
                possibleConditions.map((cond, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-blue-200 transition-all duration-300 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800 text-[11px] uppercase tracking-wide truncate max-w-[150px]">
                        {cond.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold shrink-0">
                        {cond.confidence}% Match
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                      {cond.reasoning}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-5 border border-dashed border-slate-200 rounded-xl text-slate-400 text-center font-sans font-medium">
                  Submit presenting symptoms to generate diagnostic mappings.
                </div>
              )}
            </div>
          </div>

          {/* 7. FIXED MEDICAL DISCLAIMER */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed flex items-start gap-2 text-slate-500 font-sans text-[9.5px] font-medium">
            <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>AI-generated decision support</strong> — not a diagnosis. Requires clinical verification.
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
