'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, useFBX, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'
import { 
  ArrowLeft, Activity, Sparkles, AlertTriangle, Info, AlertCircle, RefreshCw, Layers
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
  position: [number, number, number] // base local position centered at 0
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
// Smoothly Animated Callout Card (Syncs with organ positions)
// ---------------------------------------------------------
function PulsingCallout({ localPosition, organName, isAffected, condition, reasoning, severity, isSplitted, verticalOffset }: {
  localPosition: [number, number, number]
  organName: string
  isAffected: boolean
  condition?: string
  reasoning?: string
  severity?: string
  isSplitted: boolean
  verticalOffset: number
}) {
  const calloutRef = useRef<THREE.Group>(null)
  const markerRef = useRef<THREE.Mesh>(null)
  
  const color = isAffected ? '#ef4444' : '#0ea5e9'

  // Animate local position to match vertical explosion lerping
  useFrame((state) => {
    if (calloutRef.current) {
      const [lx, ly, lz] = localPosition
      const targetY = isSplitted ? ly + verticalOffset : ly
      calloutRef.current.position.y = THREE.MathUtils.lerp(calloutRef.current.position.y, targetY, 0.15)
    }
    if (markerRef.current) {
      const t = state.clock.getElapsedTime()
      const scale = 1 + Math.sin(t * 8) * 0.15
      markerRef.current.scale.set(scale, scale, scale)
    }
  })

  // Adjust pointer label side
  const isRight = localPosition[0] >= 0
  const lineLen = isRight ? 0.65 : -0.65
  const labelOffset: [number, number, number] = [lineLen, 0.15, 0]

  const severityBadgeClass = 
    severity?.toUpperCase() === 'CRITICAL' || severity?.toUpperCase() === 'HIGH'
      ? 'bg-red-950/40 border-red-500/30 text-red-400'
      : severity?.toUpperCase() === 'MEDIUM'
      ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'

  return (
    <group ref={calloutRef} position={[localPosition[0], localPosition[1], localPosition[2]]}>
      {/* Pulsing Core */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.042, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isAffected ? 2.5 : 0.2} transparent opacity={0.9} />
      </mesh>
      
      {/* Pointer Line */}
      <Line points={[[0, 0, 0], labelOffset]} color={color} lineWidth={1.2} />
      
      {/* Clean Callout Label */}
      <Html distanceFactor={5} position={labelOffset} zIndexRange={[100, 0]}>
        <div className={`pointer-events-none transition-all duration-300 shadow-xl p-3 rounded-xl border border-slate-700/60 font-sans backdrop-blur-md ${
          isAffected
            ? 'w-56 bg-slate-900/95 text-slate-100'
            : 'px-2.5 py-1 rounded-md bg-slate-900 border-slate-700 text-slate-400 text-[9px] font-semibold whitespace-nowrap'
        }`}>
          {isAffected ? (
            <div className="flex flex-col gap-1 text-[10px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1 font-mono">
                <span className="text-[8px] tracking-wider text-slate-400 uppercase font-bold">Clinical Mapping</span>
                {severity && (
                  <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border uppercase ${severityBadgeClass}`}>
                    {severity}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[11px] text-white uppercase">{organName}</h3>
              {condition && <div className="font-bold text-[10px] text-red-400 mt-0.5">{condition}</div>}
              {reasoning && <p className="text-[9.5px] text-slate-400 leading-snug mt-1 font-sans border-t border-slate-800 pt-1 font-medium">{reasoning}</p>}
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
  path, positionX, activeSystems, highlightedMeshNames, viewMode, visible, isSplitted, affectedOrganIds, conditionsByOrgan, onModelClick
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]; viewMode: 'split' | 'single'; visible: boolean; isSplitted: boolean; affectedOrganIds: string[]; conditionsByOrgan: any; onModelClick: () => void
}) {
  const { scene } = useGLTF(path)
  const groupRef = useRef<THREE.Group>(null)

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
    
    // Initial static position X
    clone.position.set(0, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

    // Compute organ explosion vertical offsets and apply permanent brain offset
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh || (child as any).isMesh) {
        const name = child.name.toLowerCase()
        const parentName = child.parent ? child.parent.name.toLowerCase() : ''
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
        
        const isColumn2Organ = positionX === -1.2 && path.includes('splanchnology')
        if (isColumn2Organ) {
          const isBrain = name.includes('brain') || name.includes('cerebr') || parentName.includes('brain') || parentName.includes('cerebr')
          if (isBrain) {
            // Permanently align brain mesh inside the head region
            child.position.y += 0.7 / scaleFactor
          } else {
            const offset = getOrganVerticalOffset(name, matNames)
            if (offset !== 0) {
              child.userData.originalY = child.userData.originalY ?? child.position.y
              child.userData.offsetY = offset / scaleFactor
            }
          }
        }
      }
    })

    // Clone materials
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

  // LERP ANIMATIONS: Smooth split-view slide out & organ explosion vertical lerps
  useFrame(() => {
    if (groupRef.current) {
      // Horizontal split slide out
      const targetX = (viewMode === 'split' && isSplitted) ? positionX : 0.0
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.12)
    }

    // Explode column 2 organs vertically
    if (positionX === -1.2 && path.includes('splanchnology')) {
      cloned.traverse((child) => {
        if (child.userData.offsetY !== undefined) {
          const originalY = child.userData.originalY ?? child.position.y
          // Animate to exploded Y only when splitting is active
          const targetY = (viewMode === 'split' && isSplitted) ? originalY + child.userData.offsetY : originalY
          child.position.y = THREE.MathUtils.lerp(child.position.y, targetY, 0.12)
        }
      })
    }
  })

  // Apply visibility and highlights
  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      const name = child.name.toLowerCase()
      
      // Fast GPU toggling: hide immediately if layer is unchecked
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
        meshVisible = activeSystems.muscular
      }

      mesh.visible = meshVisible

      // Apply translucency / highlights
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((m: any) => {
        if (!m) return
        const isSkin = name.includes('skin') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('hair')
        
        if (isSkin) {
          m.transparent = true
          // Semi-translucent in Single View / Merged Split View to view internal organs
          const isMergedInSplitMode = viewMode === 'split' && !isSplitted
          m.opacity = (viewMode === 'single' || isMergedInSplitMode) ? 0.18 : 1.0
          m.wireframe = false
          m.depthWrite = (viewMode === 'split' && isSplitted)
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
  }, [cloned, activeSystems, highlightedMeshNames, positionX, path, viewMode, visible, isSplitted])

  // Organs model handles callouts so they slide and explode in perfect synchronization
  const isOrgansModel = positionX === -1.2 && path.includes('splanchnology')

  return (
    <group 
      ref={groupRef} 
      onClick={(e) => {
        e.stopPropagation()
        onModelClick()
      }}
    >
      <primitive object={cloned} />
      
      {/* Dynamic Sync'd Callouts for Organs */}
      {isOrgansModel && visible && affectedOrganIds.length > 0 && ORGANS.map(organ => {
        const systemKey = ORGAN_SYSTEM_MAP[organ.id]
        const isSystemActive = !systemKey || !!activeSystems[systemKey]
        if (!isSystemActive) return null

        const isAffected = affectedOrganIds.includes(organ.id)
        if (!isAffected) return null

        const organCond = conditionsByOrgan[organ.id]
        const scaleFactor = 2.0 // matches target height scale
        const offset = getOrganVerticalOffset(organ.id, [organ.id])

        return (
          <PulsingCallout
            key={organ.id}
            localPosition={organ.position}
            organName={organ.name}
            isAffected={isAffected}
            condition={organCond?.condition}
            reasoning={organCond?.reasoning}
            severity={organCond?.severity}
            isSplitted={viewMode === 'split' && isSplitted}
            verticalOffset={offset / 6.8} // scaled vertical offset
          />
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------
// FBX Model (Skeletal) Component (Preserves Original Colors)
// ---------------------------------------------------------
function RealisticFBXModel({
  path, positionX, activeSystems, highlightedMeshNames, viewMode, visible, isSplitted, onModelClick
}: {
  path: string; positionX: number; activeSystems: SystemToggles; highlightedMeshNames: string[]; viewMode: 'split' | 'single'; visible: boolean; isSplitted: boolean; onModelClick: () => void
}) {
  const fbx = useFBX(path)
  const groupRef = useRef<THREE.Group>(null)

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
    
    // Initial static position X
    clone.position.set(0, -box.min.y * scaleFactor - 1.0, -center.z * scaleFactor)

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

  // LERP Horizontal slide animations
  useFrame(() => {
    if (groupRef.current) {
      const targetX = (viewMode === 'split' && isSplitted) ? positionX : 0.0
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.12)
    }
  })

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (!(child instanceof THREE.Mesh || mesh.isMesh)) return
      
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
  }, [cloned, activeSystems, highlightedMeshNames, visible])

  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onModelClick()
      }}
    >
      <primitive object={cloned} />
    </group>
  )
}

// ---------------------------------------------------------
// View Anatomy Page
// ---------------------------------------------------------
export default function ViewAnatomyPage() {
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split')
  const [isSplitted, setIsSplitted] = useState<boolean>(false) // starts merged by default
  
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
    integumentary: false
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
    setIsSplitted(false)
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
      
      // Auto-split on successful analysis in Split View mode to display organs clearly
      if (viewMode === 'split') {
        setIsSplitted(true)
      }

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
      if (viewMode === 'split') {
        setIsSplitted(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Model click handler to toggle slide-out split states
  const handleModelClick = () => {
    if (viewMode === 'split') {
      setIsSplitted(prev => !prev)
    }
  }

  // Sync splitted mode on top tabs click
  useEffect(() => {
    if (viewMode === 'single') {
      setIsSplitted(false)
    }
  }, [viewMode])

  return (
    <div className="w-full h-screen bg-[#070f2b] text-gray-100 flex flex-col font-mono text-xs select-none overflow-hidden relative">
      
      {/* HEADER: Deep Dark Command Header */}
      <div className="bg-[#0b132b] border-b border-blue-950/60 px-4 py-3 z-10 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/scan" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-blue-950/50 transition text-[10px] font-bold text-gray-300 pointer-events-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-blue-950/40"></div>
          <div>
            <h1 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> 
              ABDM Clinician 3D Command Viewer
            </h1>
            <p className="text-[9px] text-slate-500 mt-0.5 font-sans font-medium">Physically based medical models. Click body to split/merge anatomical columns.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Split vs Single view toggle tabs */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-blue-950/60">
            <button 
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              Split View
            </button>
            <button 
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'single' ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              Single View
            </button>
          </div>
          <div className="h-4 w-px bg-blue-950/40 mx-1"></div>
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-bold uppercase text-[9px]">● ABDM SECURE</span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">

        {/* LEFT COLUMN: Patient Symptom Input (22% Width) */}
        <div className="w-[22%] bg-[#0b132b]/60 border-r border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              📋 Patient Symptom Input
            </span>

            <div className="space-y-3.5 text-[10px]">
              {/* Age & Sex */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[9px] font-bold">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-black/60 border border-blue-950/60 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[9px] font-bold">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    className="w-full bg-black/60 border border-blue-950/60 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Symptom Duration */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px] font-bold">Symptom Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, 2 weeks"
                  className="w-full bg-black/60 border border-blue-950/60 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                />
              </div>

              {/* Severity Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px] font-bold">Clinical Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-black/60 border border-blue-950/60 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                >
                  <option value="Low">Low (Triage Green)</option>
                  <option value="Medium">Medium (Triage Yellow)</option>
                  <option value="High">High (Triage Orange)</option>
                  <option value="Critical">Critical (Triage Red)</option>
                </select>
              </div>

              {/* Free-text Symptoms Area */}
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[9px] font-bold">Symptoms Description</label>
                <textarea
                  rows={6}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Describe patient symptoms here..."
                  className="w-full bg-black/60 border border-blue-950/60 rounded p-2.5 text-white outline-none focus:border-cyan-500/40 text-xs resize-none leading-relaxed custom-scrollbar font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 shrink-0">
            <button
              onClick={handleClear}
              className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 font-bold uppercase transition flex items-center justify-center cursor-pointer shadow-sm"
              title="Clear Symptoms & Highlights"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !symptomsInput.trim()}
              className="flex-1 py-2.5 bg-blue-950 hover:bg-blue-900 border border-blue-500/30 rounded-lg text-cyan-400 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
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
          
          <div className="flex-1 bg-[#090d16] border border-blue-950/40 rounded-2xl overflow-hidden relative flex flex-col shadow-sm">
            
            {/* Visual Instruction Badge */}
            <div className="absolute top-4 left-4 z-10 bg-black/90 border border-blue-950/50 rounded px-2.5 py-1 text-[9px] text-cyan-400 uppercase tracking-widest font-mono shadow-sm flex items-center gap-1.5 animate-pulse">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {viewMode === 'single'
                  ? 'Centered Single Layer View'
                  : isSplitted
                  ? 'Split Mode Active (Click human to Merge)'
                  : 'Standing Human (Click human to Split)'}
              </span>
            </div>

            {/* CLINICIAN CHECKBOX SELECTOR: Floating card on Canvas */}
            <div className="absolute left-4 top-16 z-20 bg-black/95 backdrop-blur-md border border-blue-950/65 rounded-xl p-3 shadow-md flex flex-col gap-2 font-mono text-[9px] w-36">
              <span className="text-slate-500 font-bold block mb-1 text-[8.5px] border-b border-blue-950/30 pb-1 uppercase tracking-wider">Layers</span>
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
                  <label key={sys.key} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors font-medium">
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleSystem(sys.key as any)}
                      className="w-3.5 h-3.5 rounded border-blue-950/60 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 cursor-pointer pointer-events-auto"
                    />
                    <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>{sys.label}</span>
                  </label>
                )
              })}
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full h-full relative z-0">
              <Canvas camera={{ position: [0, 0.2, 4.6], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
                {/* Clinical Steel Blue/Slate Background for maximum contrast */}
                <color attach="background" args={['#0a0f1d']} />
                
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
                      visible={systems.integumentary}
                      isSplitted={isSplitted}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
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
                      visible={systems.digestive || systems.respiratory}
                      isSplitted={isSplitted}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
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
                      visible={systems.skeletal}
                      isSplitted={isSplitted}
                      onModelClick={handleModelClick}
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
                      visible={systems.cardiovascular}
                      isSplitted={isSplitted}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
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
                      visible={systems.muscular}
                      isSplitted={isSplitted}
                      affectedOrganIds={affectedOrganIds}
                      conditionsByOrgan={conditionsByOrgan}
                      onModelClick={handleModelClick}
                    />
                  </Suspense>
                </Suspense>

                {/* Subtle dark floor grid for maximum visual pop */}
                <gridHelper 
                  args={[8.0, 20, '#1e293b', '#0f172a']} 
                  position={[0, -0.99, 0]}
                />

                <ContactShadows 
                  position={[0, -1.0, 0]} 
                  opacity={0.6} 
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

            {/* System layers checklist panel at bottom of viewport */}
            <div className="p-3 bg-[#0b132b] border-t border-blue-950/60 z-10 flex flex-wrap gap-2 text-[9px] justify-center items-center pointer-events-auto">
              <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Anatomy Layers:</span>
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
                  <button
                    key={sys.key}
                    onClick={() => toggleSystem(sys.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400 shadow-sm' 
                        : 'bg-black/35 border-blue-950/20 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {sys.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 4. RIGHT COLUMN: Diagnosis results dossier (25% Width) */}
        <div className="w-[25%] bg-[#0b132b]/60 border-l border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0 shadow-sm">
          
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              🔬 AI Diagnostics dossier
            </span>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-amber-400 text-[10px] flex items-start gap-1.5 leading-snug animate-pulse font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-bounce" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Red Flag Emergency Banner */}
            {redFlag && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2 animate-pulse leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 animate-bounce" />
                <span>⚠️ Urgent findings — clinical correlation required.</span>
              </div>
            )}

            {/* Mapped regions pill summary */}
            {affectedOrganIds.length > 0 && (
              <div className="p-2.5 bg-black/60 border border-blue-950/40 rounded-lg">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1.5 font-bold">Mapped Regions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set(affectedOrganIds)).map((id, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-300 text-[9px] font-bold uppercase">
                      {id.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Conditions Cards */}
            <div className="space-y-3">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Possible Conditions:</span>
              
              {possibleConditions.length > 0 ? (
                possibleConditions.map((cond, idx) => (
                  <div key={idx} className="p-3 bg-black/60 border border-blue-950/40 rounded-xl space-y-1.5 hover:border-cyan-500/20 transition-all duration-300 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-rose-400 text-[11px] uppercase tracking-wide truncate max-w-[150px]">
                        {cond.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/25 text-cyan-400 text-[9px] font-bold shrink-0">
                        {cond.confidence}% Match
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-normal font-sans font-medium">
                      {cond.reasoning}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-5 border border-dashed border-slate-800 rounded-xl text-slate-500 text-center font-sans font-medium">
                  Submit presenting symptoms to generate diagnostic mappings.
                </div>
              )}
            </div>
          </div>

          {/* 7. FIXED MEDICAL DISCLAIMER */}
          <div className="mt-6 p-3 bg-black/60 border border-blue-950/40 rounded-xl leading-relaxed flex items-start gap-2 text-slate-400 font-sans text-[9.5px] font-medium">
            <Info className="w-4.5 h-4.5 text-cyan-500 shrink-0 mt-0.5" />
            <span>
              <strong>AI-generated decision support</strong> — not a diagnosis. Requires clinical verification.
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
