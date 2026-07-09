'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, useFBX, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  Clock, 
  Heart,
  ChevronRight,
  Shield,
  Layers,
  Sliders,
  AlertCircle
} from 'lucide-react'

// ---------------------------------------------------------
// Organ & Mapping Configurations
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
  size: [number, number, number]
}

const ORGAN_MAP: Record<string, string[]> = {
  'heart': ['heart'],
  'lungs': ['lung_left', 'lung_right'],
  'brain': ['brain'],
  'liver': ['liver'],
  'kidneys': ['kidney_left', 'kidney_right'],
  'stomach': ['stomach'],
  'intestines': ['intestines']
}

const ORGAN_SYSTEM_MAP: Record<string, keyof SystemToggles> = {
  'brain': 'nervous',
  'heart': 'cardiovascular',
  'liver': 'digestive',
  'stomach': 'digestive',
  'kidney_left': 'digestive',
  'kidney_right': 'digestive',
  'intestines': 'digestive',
}

const ORGANS: BodyOrgan[] = [
  { id: 'brain', name: 'Brain', position: [0, 2.35, 0], size: [0.3, 0.25, 0.3] },
  { id: 'heart', name: 'Heart', position: [-0.08, 0.95, 0.08], size: [0.2, 0.2, 0.15] },
  { id: 'liver', name: 'Liver', position: [0.18, 0.55, 0.06], size: [0.4, 0.2, 0.25] },
  { id: 'stomach', name: 'Stomach', position: [-0.16, 0.48, 0.08], size: [0.25, 0.2, 0.2] },
  { id: 'kidney_left', name: 'Left Kidney', position: [-0.18, 0.5, -0.1], size: [0.12, 0.2, 0.12] },
  { id: 'kidney_right', name: 'Right Kidney', position: [0.18, 0.5, -0.1], size: [0.12, 0.2, 0.12] },
  { id: 'intestines', name: 'Intestines', position: [0, 0.1, 0.04], size: [0.4, 0.4, 0.25] },
]

// Helper for vertical organ explosion in Column 2
const getOrganVerticalOffset = (nodeName: string, materialNames: string[]): number => {
  const name = nodeName.toLowerCase()
  if (name.includes('brain') || name.includes('cerebr')) return 0.7
  if (name.includes('heart')) return 0.3
  const isRespiratory = materialNames.some(n => n.includes('lung') || n.includes('bronchi') || n.includes('trachea'))
  if (isRespiratory) return 0.3
  const isUrinary = materialNames.some(n => n.includes('kidney') || n.includes('bladder'))
  if (isUrinary) return -0.4
  const isDigestive = materialNames.some(n => n.includes('intestine') || n.includes('esophagus') || n.includes('stomach') || n.includes('liver')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')
  if (isDigestive) {
    if (name.includes('intestine')) return -0.7
    return 0.0
  }
  return 0.0
}

// ---------------------------------------------------------
// HUD-style Pulsing Marker
// ---------------------------------------------------------
function PulsingMarker({ 
  position, 
  organName,
  isHighlighted
}: { 
  position: [number, number, number]
  organName: string
  isHighlighted: boolean
}) {
  const markerRef = useRef<THREE.Mesh>(null)
  const color = isHighlighted ? '#ef4444' : '#06b6d4'

  useFrame((state) => {
    if (markerRef.current) {
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * 8) * 0.15
      markerRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group position={position}>
       <mesh ref={markerRef}>
         <sphereGeometry args={[0.04, 16, 16]} />
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isHighlighted ? 2.5 : 1.0} transparent opacity={0.9} />
       </mesh>
       <Html distanceFactor={4} position={[0.4, 0.1, 0]}>
          <div className={`px-2 py-0.5 rounded border text-[9px] font-mono whitespace-nowrap shadow-md select-none ${
            isHighlighted ? 'bg-red-950/90 border-red-500/60 text-red-200 animate-pulse' : 'bg-slate-950/80 border-cyan-800/40 text-cyan-400'
          }`}>
            {organName.toUpperCase()}
          </div>
       </Html>
       <Line 
         points={[[0, 0, 0], [0.4, 0.1, 0]]} 
         color={color} 
         lineWidth={1}
       />
    </group>
  )
}

// ---------------------------------------------------------
// Realistic GLTF Model Component
// ---------------------------------------------------------
function GLTFModelWrapper({
  path,
  positionX,
  opacity,
  wireframe,
  activeSystems,
  affectedRegions
}: {
  path: string
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  affectedRegions: string[]
}) {
  const { scene } = useGLTF(path)
  
  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)
    
    // Position column 1 and 2 (Organs and skin)
    if (path.includes('splanchnology')) {
      if (positionX === -1.2) {
        // Remove skin meshes from organs column
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          const name = child.name.toLowerCase()
          if (name.includes('skin') || name.includes('bone') || name.includes('skull')) {
            toRemove.push(child)
          }
        })
        toRemove.forEach((child) => { if (child.parent) child.parent.remove(child) })
      } else if (positionX === -2.4) {
        // Keep only skin/integumentary meshes
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const name = child.name.toLowerCase()
            const isSkin = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('head')
            if (!isSkin) toRemove.push(child)
          }
        })
        toRemove.forEach((child) => { if (child.parent) child.parent.remove(child) })
        const sketchfabModel = clone.getObjectByName('Sketchfab_model')
        if (sketchfabModel) sketchfabModel.rotation.set(0, 0, 0)
      }
    }

    // Positions column 4 and 5 (Vessels and muscles)
    if (path.includes('myology') || path.includes('scene')) {
      const sketchfabModel = clone.getObjectByName('Sketchfab_model')
      if (sketchfabModel) {
        sketchfabModel.rotation.set(-Math.PI / 2, 0, 0)
      } else {
        clone.rotation.x = -Math.PI / 2
      }
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
          if (!hasMesh) {
            box.copy(meshBox)
            hasMesh = true
          } else {
            box.union(meshBox)
          }
        }
      }
    })
    
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    
    clone.scale.setScalar(scaleFactor)
    clone.position.set(
      positionX - center.x * scaleFactor,
      -box.min.y * scaleFactor - 1.0,
      -center.z * scaleFactor
    )

    // Explode visceral organs vertically
    if (positionX === -1.2 && path.includes('splanchnology')) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh || (child as any).isMesh) {
          const name = child.name.toLowerCase()
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
          const offset = getOrganVerticalOffset(name, matNames)
          if (offset !== 0) child.position.y += offset / scaleFactor
        }
      })
    }
    
    return clone
  }, [scene, positionX, path])

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        const name = child.name.toLowerCase()
        let visible = true

        if (activeSystems) {
          if (path.includes('splanchnology')) {
            const isSkinMesh = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('head')
            const isBrainMesh = name.includes('brain') || name.includes('cerebr')
            const isHeartMesh = name.includes('heart')
            
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
            const isRespiratory = matNames.some(n => n.includes('lung') || n.includes('bronchi') || n.includes('trachea'))
            const isDigestive = matNames.some(n => n.includes('intestine') || n.includes('stomach') || n.includes('liver') || n.includes('kidney')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')

            if (positionX === -2.4) {
              visible = isSkinMesh && !!activeSystems.integumentary
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
            const isVessels = matNames.some(n => n.includes('artery') || n.includes('vein'))
            
            if (positionX === 1.2) {
              visible = isVessels && !!activeSystems.cardiovascular
            }
          } else if (path.includes('myology')) {
            if (positionX === 2.4) {
              const isMuscular = name.includes('muscular') || name.includes('muscle')
              visible = isMuscular && !!activeSystems.muscular
            }
          }
        }

        mesh.visible = visible

        // Apply programmatic realistic coloring
        if (visible) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m: any) => {
            if (m) {
              m.transparent = true
              
              // 1. Skin: natural semi-transparent tone
              const isSkin = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('head')
              if (isSkin) {
                if (positionX === -2.4) {
                  m.opacity = 0.22
                  m.color.set('#ecc5b2') // Natural transparent skin
                  m.wireframe = false
                  m.roughness = 0.4
                  m.metalness = 0.05
                }
              } else if (path.includes('myology')) {
                // 2. Muscles: deep natural red
                m.opacity = opacity
                m.color.set('#8e2d2d')
                m.roughness = 0.8
                m.metalness = 0.02
                m.wireframe = wireframe
              } else if (path.includes('scene')) {
                // 3. Vessels: bright red arteries, deep blue veins
                m.opacity = opacity
                m.wireframe = wireframe
                m.roughness = 0.4
                m.metalness = 0.1
                const matName = m.name.toLowerCase()
                if (matName.includes('artery') || name.includes('artery')) {
                  m.color.set('#c92222') // arteries red
                } else if (matName.includes('vein') || name.includes('vein')) {
                  m.color.set('#225ac9') // veins blue
                }
              } else if (path.includes('splanchnology') && positionX === -1.2) {
                // 4. Organs: natural colors
                m.opacity = opacity
                m.wireframe = wireframe
                m.roughness = 0.5
                m.metalness = 0.05
                const matName = m.name.toLowerCase()
                
                if (name.includes('brain') || matName.includes('brain')) {
                  m.color.set('#dfc5bb') // pink-gray brain
                } else if (name.includes('heart') || matName.includes('heart')) {
                  m.color.set('#821818') // dark crimson heart
                  m.roughness = 0.2
                } else if (name.includes('liver') || matName.includes('liver')) {
                  m.color.set('#541c1c') // liver maroon
                } else if (name.includes('stomach') || matName.includes('stomach')) {
                  m.color.set('#d4a18f') // stomach pinkish
                } else if (name.includes('intestine') || matName.includes('intestine')) {
                  m.color.set('#bfa288') // intestines beige
                } else if (name.includes('lung') || matName.includes('lung')) {
                  m.color.set('#bd8484') // lungs pinkish
                }
              }

              // Apply Emissive Highlight for affected regions matching symptoms
              const isAffected = affectedRegions.some(region => {
                const r = region.toLowerCase()
                if (r === 'heart' && (name.includes('heart') || m.name.toLowerCase().includes('heart'))) return true
                if (r === 'lungs' && (name.includes('lung') || m.name.toLowerCase().includes('lung'))) return true
                if (r === 'brain' && (name.includes('brain') || m.name.toLowerCase().includes('brain'))) return true
                if (r === 'liver' && name.includes('liver')) return true
                if (r === 'stomach' && name.includes('stomach')) return true
                if (r === 'intestines' && name.includes('intestine')) return true
                if (r === 'kidneys' && name.includes('kidney')) return true
                return name.includes(r) || m.name.toLowerCase().includes(r)
              })

              if (isAffected) {
                m.emissive.set('#ef4444') // Bright clinical red highlight glow
                m.emissiveIntensity = 2.5
              } else {
                m.emissive.set('#000000')
                m.emissiveIntensity = 0.0
              }

              m.needsUpdate = true
            }
          })
        }
      }
    })
  }, [cloned, opacity, wireframe, activeSystems, affectedRegions, positionX])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// Realistic FBX Model Component
// ---------------------------------------------------------
function FBXModelWrapper({
  path,
  positionX,
  opacity,
  wireframe,
  activeSystems,
  affectedRegions
}: {
  path: string
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  affectedRegions: string[]
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
          if (!hasMesh) {
            box.copy(meshBox)
            hasMesh = true
          } else {
            box.union(meshBox)
          }
        }
      }
    })
    
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    
    clone.scale.setScalar(scaleFactor)
    clone.position.set(
      positionX - center.x * scaleFactor,
      -box.min.y * scaleFactor - 1.0,
      -center.z * scaleFactor
    )

    clone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (!mesh.isSkinnedMesh && mesh.geometry) {
          if (mesh.geometry.attributes.skinIndex) mesh.geometry.deleteAttribute('skinIndex')
          if (mesh.geometry.attributes.skinWeight) mesh.geometry.deleteAttribute('skinWeight')
        }
      }
    })
    
    return clone
  }, [fbx, positionX])

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        let visible = true
        if (activeSystems) visible = !!activeSystems.skeletal
        mesh.visible = visible

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (m) {
            m.transparent = true
            
            // Bones: realistic ivory bone color
            m.opacity = opacity
            m.color.set('#ede6d6')
            m.roughness = 0.8
            m.metalness = 0.05
            m.wireframe = wireframe

            // Apply highlight if skeletal system is flagged
            const isAffected = affectedRegions.some(region => {
              const r = region.toLowerCase()
              return r === 'skeleton' || r === 'bones' || r === 'skeletal' || child.name.toLowerCase().includes(r)
            })

            if (isAffected) {
              m.emissive.set('#ef4444')
              m.emissiveIntensity = 2.0
            } else {
              m.emissive.set('#000000')
              m.emissiveIntensity = 0.0
            }

            m.needsUpdate = true
          }
        })
      }
    })
  }, [cloned, opacity, wireframe, activeSystems, affectedRegions])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// Golden-Yellow Nerves Overlay
// ---------------------------------------------------------
function NervesOverlay({
  positionX,
  opacity,
  wireframe,
  activeSystems,
  affectedRegions
}: {
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  affectedRegions: string[]
}) {
  const { scene } = useGLTF('/ai-in-healthcare/anatomy.glb')
  
  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)
    
    // Keep only nerves mesh
    const toRemove: THREE.Object3D[] = []
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        if (!name.includes('nerves') && !name.includes('nerve')) {
          toRemove.push(child)
        }
      }
    })
    toRemove.forEach((child) => { if (child.parent) child.parent.remove(child) })
    
    clone.updateWorldMatrix(true, true)
    
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
          const meshBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld)
          if (!hasMesh) {
            box.copy(meshBox)
            hasMesh = true
          } else {
            box.union(meshBox)
          }
        }
      }
    })
    
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    
    clone.scale.setScalar(scaleFactor)
    clone.position.set(
      positionX - center.x * scaleFactor,
      -box.min.y * scaleFactor - 1.0,
      -center.z * scaleFactor
    )
    
    return clone
  }, [scene, positionX])

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        let visible = true
        if (activeSystems) visible = !!activeSystems.nervous
        mesh.visible = visible

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (m) {
            m.transparent = true
            
            // Golden-yellow nerves PBR
            m.opacity = opacity
            m.color.set('#e0b510')
            m.roughness = 0.5
            m.metalness = 0.1
            m.wireframe = wireframe

            const isAffected = affectedRegions.some(region => {
              const r = region.toLowerCase()
              return r === 'nerves' || r === 'nervous' || r === 'brain' || child.name.toLowerCase().includes(r)
            })

            if (isAffected) {
              m.emissive.set('#ef4444')
              m.emissiveIntensity = 2.0
            } else {
              m.emissive.set('#000000')
              m.emissiveIntensity = 0.0
            }

            m.needsUpdate = true
          }
        })
      }
    })
  }, [cloned, opacity, wireframe, activeSystems, affectedRegions])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// Anatomy Viewer Page Component
// ---------------------------------------------------------
export default function ViewAnatomyPage() {
  // Input parameters state
  const [age, setAge] = useState<number>(38)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState<string>('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High')
  const [symptomsInput, setSymptomsInput] = useState<string>('severe pain lower right abdomen, fever, nausea')

  // Analysis result states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [affectedRegions, setAffectedRegions] = useState<string[]>([])
  const [possibleConditions, setPossibleConditions] = useState<Array<{ name: string; confidence: number; reasoning: string }>>([])
  const [redFlag, setRedFlag] = useState<boolean>(false)

  // 3D Visualizer settings
  const [opacity, setOpacity] = useState(0.85)
  const [wireframe, setWireframe] = useState(false)
  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true,
    muscular: false,
    nervous: true,
    cardiovascular: true,
    respiratory: true,
    digestive: true,
    lymphatic: false,
    integumentary: true
  })

  // Set initial mock analysis on load to demonstrate functionality
  useEffect(() => {
    // Stub scenario
    setAffectedRegions(['intestines'])
    setPossibleConditions([
      {
        name: 'Acute Appendicitis',
        confidence: 92,
        reasoning: 'Localized tenderness, pain in the right lower quadrant, nausea, and low-grade pyrexia match clinical appendicitis.'
      }
    ])
    setRedFlag(true)
  }, [])

  const handleAnalyze = async () => {
    if (!symptomsInput.trim()) return
    setIsLoading(true)
    setErrorMsg(null)
    setAffectedRegions([])
    setPossibleConditions([])
    setRedFlag(false)

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          sex,
          duration,
          severity,
          symptoms: symptomsInput
        })
      })

      if (!response.ok) {
        throw new Error('API server responded with an error.')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setAffectedRegions(data.affectedRegions || [])
      setPossibleConditions(data.possibleConditions || [])
      setRedFlag(!!data.redFlag)

    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || 'Connection failure. Running diagnosis stub instead.')
      // Graceful fallback stub in case of network/key errors
      setAffectedRegions(['stomach', 'intestines'])
      setPossibleConditions([
        {
          name: 'Transient Gastrointestinal Distress (Fallback)',
          confidence: 70,
          reasoning: 'A generic fallback analysis triggered due to downstream LLM endpoint validation delay.'
        }
      ])
      setRedFlag(false)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="w-full h-screen bg-[#020617] text-gray-100 flex flex-col font-mono text-xs select-none overflow-hidden relative">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#070f2b]/85 border-b border-blue-950/60 p-4 z-10 flex justify-between items-center backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            href="/scan" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-blue-950/50 hover:bg-slate-800 transition text-[10px] font-bold text-gray-300 pointer-events-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK TO CLINIC
          </Link>
          <div className="h-4 w-px bg-blue-950/40"></div>
          <div>
            <h1 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> 
              Clinical 3D Visualizer & Triage Console
            </h1>
            <p className="text-[9px] text-slate-500 mt-0.5">Physically Based Rendering (PBR) anatomical twin matching symptoms.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[9px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/25 text-emerald-400 font-bold uppercase">
            ● ABDM SECURE
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/25 text-blue-400 font-bold uppercase">
            DEEPSEEK R1 COMPATIBLE
          </span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden min-h-0">

        {/* 2. LEFT COLUMN: Patient Symptom Input Panel (22% Width) */}
        <div className="w-full lg:w-[22%] bg-[#070f2b]/40 border-r border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              📋 Patient Symptom Input
            </span>

            <div className="space-y-3.5 text-[10px]">
              {/* Age & Sex */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 35)}
                    className="w-full bg-black/60 border border-blue-950/60 rounded px-2.5 py-1.5 text-white outline-none focus:border-cyan-500/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase">Sex</label>
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
                <label className="text-slate-500 uppercase">Symptom Duration</label>
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
                <label className="text-slate-500 uppercase">Clinical Severity</label>
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
                <label className="text-slate-500 uppercase">Symptoms Description</label>
                <textarea
                  rows={6}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="Describe patient symptoms here (e.g. crushing chest pain, nausea, fever...)"
                  className="w-full bg-black/60 border border-blue-950/60 rounded p-2.5 text-white outline-none focus:border-cyan-500/40 text-xs resize-none leading-relaxed custom-scrollbar"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !symptomsInput.trim()}
            className="w-full mt-4 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.1)] disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
                ANALYZING CLINICAL SYMPTOMS...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze & Map Anatomy
              </>
            )}
          </button>
        </div>

        {/* 3. CENTER COLUMN: 3D Visualization Viewport (53% Width) */}
        <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden relative">
          
          {/* 3D Canvas rendering */}
          <div className="flex-1 bg-black/45 border border-blue-950/50 rounded-2xl overflow-hidden relative flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-slate-950/80 border border-blue-950/40 rounded px-2.5 py-1 text-[9px] text-cyan-400 uppercase tracking-widest font-mono">
              🧬 Anatomical Split View (5 Columns)
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 w-full h-full relative z-0">
              <Canvas camera={{ position: [0, 0.2, 4.6], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
                <color attach="background" args={['#020617']} />
                
                {/* Cinematic Studio Lighting */}
                <ambientLight intensity={0.55} color="#ffffff" />
                <directionalLight position={[10, 15, 5]} intensity={1.5} color="#ffffff" castShadow />
                <directionalLight position={[-10, 10, -5]} intensity={1.0} color="#b0d4ff" />
                <spotLight position={[0, 12, 0]} intensity={2.0} angle={0.6} penumbra={1} color="#ffffff" />

                {/* Spotlights matching the 5 columns */}
                <spotLight position={[-2.4, 5, 2]} intensity={2.0} distance={8} color="#ffffff" castShadow />
                <spotLight position={[-1.2, 5, 2]} intensity={2.0} distance={8} color="#ffffff" castShadow />
                <spotLight position={[0.0, 5, 2]} intensity={2.5} distance={8} color="#ffffff" castShadow />
                <spotLight position={[1.2, 5, 2]} intensity={2.0} distance={8} color="#ffffff" castShadow />
                <spotLight position={[2.4, 5, 2]} intensity={2.0} distance={8} color="#ffffff" castShadow />

                <Suspense fallback={null}>
                  {/* Column 1: Body Skin/Integumentary */}
                  <Suspense fallback={null}>
                    <GLTFModelWrapper 
                      path="/ai-in-healthcare/asset-01/splanchnology.glb" 
                      positionX={-2.4} 
                      opacity={opacity} 
                      wireframe={wireframe} 
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                  </Suspense>

                  {/* Column 2: Visceral Organs (from splanchnology.glb, exploded) */}
                  <Suspense fallback={null}>
                    <GLTFModelWrapper 
                      path="/ai-in-healthcare/asset-01/splanchnology.glb" 
                      positionX={-1.2} 
                      opacity={opacity} 
                      wireframe={wireframe} 
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                  </Suspense>
                  
                  {/* Column 3: Skeletal + Nerves overlay */}
                  <Suspense fallback={null}>
                    <FBXModelWrapper 
                      path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" 
                      positionX={0.0} 
                      opacity={opacity} 
                      wireframe={wireframe} 
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                    <NervesOverlay 
                      positionX={0.0}
                      opacity={opacity}
                      wireframe={wireframe}
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                  </Suspense>

                  {/* Column 4: Cardiovascular vessels */}
                  <Suspense fallback={null}>
                    <GLTFModelWrapper 
                      path="/ai-in-healthcare/asset-01/scene.gltf" 
                      positionX={1.2} 
                      opacity={opacity} 
                      wireframe={wireframe} 
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                  </Suspense>

                  {/* Column 5: Muscular system */}
                  <Suspense fallback={null}>
                    <GLTFModelWrapper 
                      path="/ai-in-healthcare/asset-01/myology.glb" 
                      positionX={2.4} 
                      opacity={opacity} 
                      wireframe={wireframe} 
                      activeSystems={systems}
                      affectedRegions={affectedRegions}
                    />
                  </Suspense>
                </Suspense>

                {/* Render interactive markers calibrated for Column 2 (-1.2 dx) */}
                {ORGANS.map(organ => {
                  const systemKey = ORGAN_SYSTEM_MAP[organ.id]
                  const isSystemActive = !systemKey || !!systems[systemKey]
                  if (!isSystemActive) return null

                  const isHighlighted = affectedRegions.some(r => r.toLowerCase() === organ.id.toLowerCase())
                  const [bx, by, bz] = organ.position
                  const adjustedPosition: [number, number, number] = [bx - 1.2, by, bz]

                  return (
                    <PulsingMarker
                      key={`anomaly-${organ.id}`}
                      position={adjustedPosition}
                      organName={organ.name}
                      isHighlighted={isHighlighted}
                    />
                  )
                })}

                {/* Cyberpunk grid background */}
                <gridHelper 
                  args={[8.0, 20, '#0ea5e9', '#002244']} 
                  position={[0, -0.99, 0]}
                />
                <mesh position={[0, -0.995, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[8.0, 2.0]} />
                  <meshStandardMaterial color="#0ea5e9" transparent opacity={0.05} side={THREE.DoubleSide} />
                </mesh>

                <ContactShadows 
                  position={[0, -1.0, 0]} 
                  opacity={0.8} 
                  scale={7} 
                  blur={2.5} 
                  far={3} 
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
            <div className="p-3 bg-slate-950/75 border-t border-blue-950/40 z-10 flex flex-wrap gap-2 text-[9px] justify-center items-center pointer-events-auto">
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
                    className={`px-2 py-1 rounded transition-all cursor-pointer border ${
                      isActive ? 'bg-cyan-950/50 border-cyan-500/35 text-cyan-400 font-bold' : 'bg-black/35 border-blue-950/20 text-slate-500'
                    }`}
                  >
                    {sys.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 4. RIGHT COLUMN: diagnosis result dossier (25% Width) */}
        <div className="w-full lg:w-[25%] bg-[#070f2b]/40 border-l border-blue-950/50 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar shrink-0">
          
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 border-b border-blue-950/30 pb-2">
              🔬 AI Diagnostics dossier
            </span>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-400 text-[10px] flex items-start gap-1.5 leading-snug animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Red Flag Emergency Banner */}
            {redFlag && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2 animate-pulse leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠️ Urgent findings — clinical correlation required.</span>
              </div>
            )}

            {/* Diagnostic Conditions Cards */}
            <div className="space-y-3">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Possible Conditions:</span>
              
              {possibleConditions.length > 0 ? (
                possibleConditions.map((cond, idx) => (
                  <div key={idx} className="p-3 bg-black/40 border border-blue-950/40 rounded-xl space-y-1.5 hover:border-cyan-500/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-rose-400 text-[11px] uppercase tracking-wide truncate max-w-[150px]">
                        {cond.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold">
                        {cond.confidence}% Match
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      {cond.reasoning}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-center">
                  Submit symptom entry to construct diagnosis maps.
                </div>
              )}
            </div>
          </div>

          {/* 7. FIXED MEDICAL DISCLAIMER */}
          <div className="mt-6 p-3 bg-slate-950/60 border border-blue-950/40 rounded-xl leading-relaxed flex items-start gap-2 text-slate-400 font-sans text-[10px]">
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
