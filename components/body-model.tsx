'use client'

import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html, Line, useFBX } from '@react-three/drei'
import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'


interface RegionInfo {
  bodyRegion: string
  confidence: 'high' | 'medium' | 'low'
  condition: string
  reasoning: string
}

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

interface BodyModelProps {
  affectedRegions: RegionInfo[]
  opacity?: number
  wireframe?: boolean
  activeSystems?: SystemToggles
  vitals?: { temp: string; hr: string; spo2: string; bp: string }
  patientId?: string
  symptomHighlightedRegions?: string[] // Added for symptom analysis highlights
}

interface BodyOrgan {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
}

// ─────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE ORGAN VOCABULARY MAP
// Every term DeepSeek can return is normalized to canonical organ IDs
// ─────────────────────────────────────────────────────────────────────────
const ORGAN_MAP: Record<string, string[]> = {
  // Heart & Cardiovascular
  'heart': ['heart'],
  'cardiac': ['heart'],
  'myocardium': ['heart'],
  'pericardium': ['heart'],
  'coronary': ['heart'],
  'aorta': ['heart', 'aorta'],
  'aortic': ['heart', 'aorta'],
  'ventricle': ['heart'],
  'atrium': ['heart'],
  'valve': ['heart'],
  'pericardial': ['heart'],

  // Lungs & Respiratory
  'lungs': ['lung_left', 'lung_right'],
  'lung': ['lung_left', 'lung_right'],
  'pulmonary': ['lung_left', 'lung_right'],
  'bronchi': ['lung_left', 'lung_right'],
  'bronchial': ['lung_left', 'lung_right'],
  'pleura': ['lung_left', 'lung_right'],
  'pleural': ['lung_left', 'lung_right'],
  'trachea': ['trachea'],
  'throat': ['throat'],
  'pharynx': ['throat'],
  'larynx': ['throat'],
  'nasal_cavity': ['nasal_cavity'],
  'nasal': ['nasal_cavity'],
  'sinuses': ['nasal_cavity'],
  'sinus': ['nasal_cavity'],
  'diaphragm': ['lung_left', 'lung_right'],
  'respiratory': ['lung_left', 'lung_right', 'trachea'],

  // Brain & Nervous System
  'brain': ['brain'],
  'cerebral': ['brain'],
  'cerebrum': ['brain'],
  'cerebellum': ['brain'],
  'meningeal': ['brain'],
  'meninges': ['brain'],
  'cranial': ['brain'],
  'neurological': ['brain'],
  'spinal': ['spinal_cord'],
  'spine': ['spinal_cord'],
  'spinal_cord': ['spinal_cord'],

  // Liver & Hepatic
  'liver': ['liver'],
  'hepatic': ['liver'],
  'hepatitis': ['liver'],
  'biliary': ['liver', 'gallbladder'],
  'bile': ['liver', 'gallbladder'],
  'gallbladder': ['gallbladder'],
  'cholecyst': ['gallbladder'],

  // Kidneys & Urinary
  'kidneys': ['kidney_left', 'kidney_right'],
  'kidney': ['kidney_left', 'kidney_right'],
  'renal': ['kidney_left', 'kidney_right'],
  'nephro': ['kidney_left', 'kidney_right'],
  'ureter': ['kidney_left', 'kidney_right'],
  'bladder': ['bladder'],
  'urinary': ['kidney_left', 'kidney_right', 'bladder'],
  'urethra': ['bladder'],

  // Digestive
  'stomach': ['stomach'],
  'gastric': ['stomach'],
  'gastro': ['stomach'],
  'intestines': ['intestines'],
  'intestinal': ['intestines'],
  'bowel': ['intestines'],
  'colon': ['intestines'],
  'colonic': ['intestines'],
  'appendix': ['appendix'],
  'appendicitis': ['appendix'],
  'rectum': ['intestines'],
  'duodenum': ['stomach', 'intestines'],
  'esophagus': ['throat', 'stomach'],
  'oesophagus': ['throat', 'stomach'],

  // Pancreas
  'pancreas': ['pancreas'],
  'pancreatic': ['pancreas'],
  'insulin': ['pancreas'],
  'diabetes': ['pancreas'],
  'diabetic': ['pancreas'],

  // Spleen
  'spleen': ['spleen'],
  'splenic': ['spleen'],

  // Skin & Musculoskeletal
  'skin': ['skin'],
  'integumentary': ['skin'],
  'dermatitis': ['skin'],
  'rash': ['skin'],
  'muscle': ['muscle'],
  'muscular': ['muscle'],
  'joint': ['muscle'],
  'bone': ['skeleton'],
  'skeletal': ['skeleton'],
  'fracture': ['skeleton'],

  // Lymphatic
  'lymph': ['lymph_nodes'],
  'lymphatic': ['lymph_nodes'],
  'lymph_nodes': ['lymph_nodes'],
  'lymphoma': ['lymph_nodes'],
}

// ─────────────────────────────────────────────────────────────────────────
// BODY SYSTEM ASSIGNMENT MAP
// ─────────────────────────────────────────────────────────────────────────
const ORGAN_SYSTEM_MAP: Record<string, keyof SystemToggles> = {
  'brain': 'nervous',
  'spinal_cord': 'nervous',
  'throat': 'respiratory',
  'nasal_cavity': 'respiratory',
  'trachea': 'respiratory',
  'lung_left': 'respiratory',
  'lung_right': 'respiratory',
  'heart': 'cardiovascular',
  'aorta': 'cardiovascular',
  'liver': 'digestive',
  'stomach': 'digestive',
  'pancreas': 'digestive',
  'gallbladder': 'digestive',
  'spleen': 'digestive',
  'appendix': 'digestive',
  'intestines': 'digestive',
  'kidney_left': 'digestive',
  'kidney_right': 'digestive',
  'bladder': 'digestive',
  'skin': 'integumentary',
  'lymph_nodes': 'lymphatic',
}

// ─────────────────────────────────────────────────────────────────────────
// ANATOMICALLY ACCURATE ORGAN POSITIONS
// Calibrated for /anatomy.glb at y=-1, scale=6.8
// Coordinate system: X=left/right, Y=up/down, Z=front/back
// ─────────────────────────────────────────────────────────────────────────
const ORGANS: BodyOrgan[] = [
  // Head & Neck
  { id: 'brain',         name: 'Brain',          position: [0,     2.38,  0.0],  size: [0.28, 0.22, 0.28] },
  { id: 'nasal_cavity',  name: 'Nasal Cavity',   position: [0,     2.18,  0.14], size: [0.1,  0.1,  0.1]  },
  { id: 'throat',        name: 'Throat/Larynx',  position: [0,     1.82,  0.06], size: [0.1,  0.18, 0.1]  },
  { id: 'trachea',       name: 'Trachea',        position: [0,     1.55,  0.04], size: [0.07, 0.3,  0.07] },

  // Thoracic — Heart slightly left of midline, lungs flanking
  { id: 'lung_left',     name: 'Left Lung',      position: [-0.28, 1.05,  0.02], size: [0.22, 0.45, 0.22] },
  { id: 'lung_right',    name: 'Right Lung',     position: [0.28,  1.05,  0.02], size: [0.22, 0.45, 0.22] },
  { id: 'heart',         name: 'Heart',          position: [-0.07, 0.98,  0.1],  size: [0.18, 0.2,  0.14] },
  { id: 'aorta',         name: 'Aorta',          position: [0,     0.88,  0.05], size: [0.06, 0.35, 0.06] },

  // Abdominal — anatomically precise quadrants
  { id: 'liver',         name: 'Liver',          position: [0.22,  0.58,  0.07], size: [0.35, 0.18, 0.22] }, // Right upper quadrant
  { id: 'stomach',       name: 'Stomach',        position: [-0.14, 0.52,  0.09], size: [0.22, 0.18, 0.18] }, // Left upper quadrant
  { id: 'gallbladder',   name: 'Gallbladder',    position: [0.18,  0.44,  0.1],  size: [0.08, 0.08, 0.08] }, // Under liver
  { id: 'spleen',        name: 'Spleen',         position: [-0.3,  0.52, -0.04], size: [0.12, 0.14, 0.1]  }, // Left upper, posterior
  { id: 'pancreas',      name: 'Pancreas',       position: [-0.06, 0.45,  0.0],  size: [0.25, 0.08, 0.1]  }, // Behind stomach, horizontal

  // Retroperitoneal — Kidneys behind peritoneum, flanking spine
  { id: 'kidney_left',   name: 'Left Kidney',    position: [-0.22, 0.42, -0.12], size: [0.1,  0.18, 0.1]  },
  { id: 'kidney_right',  name: 'Right Kidney',   position: [0.22,  0.42, -0.12], size: [0.1,  0.18, 0.1]  },

  // Pelvic
  { id: 'intestines',    name: 'Small Intestine',position: [0,     0.18,  0.06], size: [0.32, 0.28, 0.22] },
  { id: 'appendix',      name: 'Appendix',       position: [0.22,  0.08,  0.08], size: [0.05, 0.1,  0.05] }, // Right iliac fossa
  { id: 'bladder',       name: 'Urinary Bladder',position: [0,    -0.12,  0.06], size: [0.14, 0.12, 0.12] },

  // Spine & Nervous
  { id: 'spinal_cord',   name: 'Spinal Cord',    position: [0,     0.8,  -0.1],  size: [0.05, 0.8,  0.05] },

  // Skin / Surface
  { id: 'skin',          name: 'Integumentary',  position: [0,     1.0,   0.18], size: [0.5,  1.0,  0.1]  },
  { id: 'lymph_nodes',   name: 'Lymph Nodes',    position: [0,     1.1,   0.06], size: [0.2,  0.4,  0.1]  },
]

// ---------------------------------------------------------
// Error Boundary to gracefully fallback when /anatomy.glb is missing
// ---------------------------------------------------------
class ModelErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.log("No custom anatomy.glb found in /public. Using procedural fallback.")
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ---------------------------------------------------------
// Humanoid Avatar Wrapper (Realistic Transparent Body)
// ---------------------------------------------------------
function AvatarBody({ opacity = 0.85, wireframe = false }: { opacity?: number, wireframe?: boolean }) {
  const basePath = '/ai-in-healthcare'
  const { scene } = useGLTF(`${basePath}/anatomy.glb`)
  
  const realisticSkinMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: wireframe ? '#0ea5e9' : '#0022ff',
    transmission: wireframe ? 0 : 0.95,
    opacity: wireframe ? 0.3 : 0.2, // Transparent body skin
    metalness: 0.8,
    roughness: 0.1,
    ior: 1.2,
    thickness: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [wireframe])

  useFrame(() => {
    scene.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        const name = child.name.toLowerCase()
        // Override material ONLY for the body skin mesh to keep skeleton/organs colored
        if (name.includes('body') || name.includes('skin') || name.includes('human') || name.includes('mesh') || name.includes('geometry_0')) {
          mesh.material = realisticSkinMaterial
        }
      }
    })
  })

  // Scale 6.8 and position y=-1 matches the original "big" model centering for /anatomy.glb
  return <primitive object={scene} position={[0, -1.0, 0]} scale={6.8} />
}

// ─────────────────────────────────────────────────────────────────────────
// PulsingMarker — Clean HUD callout pinned to organ centroid
// ─────────────────────────────────────────────────────────────────────────
function PulsingMarker({
  position, confidence, condition, reasoning, organName
}: {
  position: [number, number, number]
  confidence: string
  condition: string
  reasoning: string
  organName: string
}) {
  const markerRef = useRef<THREE.Mesh>(null)
  const ringRef   = useRef<THREE.Mesh>(null)

  const color =
    confidence === 'high'   ? '#ef4444' :
    confidence === 'medium' ? '#f97316' : '#eab308'

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (markerRef.current) {
      const s = 1 + Math.sin(t * 6) * 0.18
      markerRef.current.scale.setScalar(s)
    }
    if (ringRef.current) {
      const r = 1 + Math.sin(t * 3) * 0.35
      ringRef.current.scale.setScalar(r)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - Math.sin(t * 3) * 0.35
    }
  })

  const isRight = position[0] >= 0
  const lx = isRight ? 0.82 : -0.82
  const labelOffset: [number, number, number] = [lx, 0.1, 0]
  const sideStyle = isRight
    ? { borderLeft: `2px solid ${color}`, borderRight: 'none', paddingLeft: '8px' }
    : { borderRight: `2px solid ${color}`, borderLeft: 'none', paddingRight: '8px' }

  return (
    <group position={position}>
      {/* Core glowing dot */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.5} transparent opacity={1} />
      </mesh>

      {/* Expanding pulse ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.055, 0.075, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Hairline pointer */}
      <Line
        points={[[0, 0, 0], labelOffset]}
        color={color}
        lineWidth={1.0}
        dashed
        dashSize={0.04}
        gapSize={0.025}
      />

      {/* Endpoint dot on line */}
      <mesh position={labelOffset}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Clinical callout panel */}
      <Html distanceFactor={5} position={labelOffset} zIndexRange={[100, 0]} center={false}>
        <div
          className="pointer-events-none font-sans"
          style={{
            width: '200px',
            background: 'rgba(4, 6, 20, 0.97)',
            border: `1px solid ${color}40`,
            borderRadius: '8px',
            boxShadow: `0 0 20px ${color}25, 0 4px 24px rgba(0,0,0,0.8)`,
            padding: '10px 12px',
            ...sideStyle,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase' }}>Affected Region</span>
            <span style={{
              fontFamily: 'monospace', fontSize: '8px', fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', color, background: `${color}18`,
              padding: '1px 6px', borderRadius: '4px', border: `1px solid ${color}35`
            }}>{confidence}</span>
          </div>

          {/* Organ name */}
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            {organName}
          </div>

          {/* Condition */}
          {condition && (
            <div style={{ fontSize: '10px', fontWeight: 700, color, marginBottom: '5px', lineHeight: 1.4 }}>
              {condition}
            </div>
          )}

          {/* Reasoning */}
          {reasoning && (
            <div style={{
              fontSize: '9px', color: '#94a3b8', lineHeight: 1.5,
              paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {reasoning}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// ---------------------------------------------------------
// Organ Label Component
// ---------------------------------------------------------
function OrganLabel({ organ, isAffected, showLabel }: { organ: BodyOrgan; isAffected: boolean; showLabel: boolean }) {
  const [hovered, setHovered] = useState(false)

  const lineLen = 0.6
  const isRight = organ.position[0] >= 0
  const labelOffset: [number, number, number] = [lineLen * (isRight ? 1 : -1), 0.1, 0]

  return (
    <group position={organ.position}>
      {/* Invisible hover helper */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
      >
        <sphereGeometry args={[organ.size[0] + 0.05, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {(showLabel || hovered) && (
        <group>
          <Html distanceFactor={5} position={labelOffset} zIndexRange={[50, 0]}>
            <div className={`
              flex items-center gap-2 px-2.5 py-1 rounded border backdrop-blur-md shadow-lg 
              whitespace-nowrap pointer-events-none transition-all duration-300 font-mono text-[9px] tracking-wider
              ${isAffected 
                ? 'bg-red-950/80 border-red-500/60 text-red-200 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                : 'bg-black/85 border-cyan-800/60 text-cyan-300 scale-100'}
            `}>
              {isAffected && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
              <span className="font-bold uppercase">{organ.name}</span>
            </div>
          </Html>
          <Line 
            points={[[0, 0, 0], labelOffset]} 
            color={isAffected ? '#ef4444' : '#00cccc'} 
            lineWidth={1}
          />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------
// Helper for vertical organ explosion in Column 2
// ---------------------------------------------------------
const getOrganVerticalOffset = (nodeName: string, materialNames: string[]): number => {
  const name = nodeName.toLowerCase()
  
  const isBrainMesh = name.includes('brain') || name.includes('cerebrum') || name.includes('cerebell') || name.includes('pons') || name.includes('medulla')
  if (isBrainMesh) return 0.0
  
  const isHeartMesh = name.includes('heart') || name.includes('atrium') || name.includes('ventricle')
  if (isHeartMesh) return 0.3
  
  const isRespiratory = materialNames.some((n: any) => n.includes('lung') || n.includes('bronchi') || n.includes('trachea') || n.includes('cartilage'))
  if (isRespiratory) return 0.3
  
  const isUrinary = materialNames.some((n: any) => n.includes('organ.004') || n.includes('gland.004') || n.includes('kidney') || n.includes('bladder'))
  if (isUrinary) return -0.4
  
  const isDigestive = materialNames.some((n: any) => n.includes('intestine') || n.includes('organ.003') || n.includes('esophagus') || n.includes('stomach') || n.includes('liver')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')
  if (isDigestive) {
    if (name.includes('intestine') || materialNames.some((n: any) => n.includes('intestine'))) {
      return -0.7
    }
    return 0.0
  }
  
  return 0.0
}

// ---------------------------------------------------------
// Side-by-Side Model Components (Preserving original textures/materials)
// ---------------------------------------------------------
// ---------------------------------------------------------
// GLTF Model Wrapper Component
// ---------------------------------------------------------
function GLTFModelWrapper({
  path,
  positionX,
  opacity,
  wireframe,
  activeSystems,
  symptomHighlightedRegions
}: {
  path: string
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  symptomHighlightedRegions?: string[]
}) {
  const { scene } = useGLTF(path)
  
  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)

    // 1. Apply model-specific root rotations BEFORE bounding box computation
    if (path.includes('myology') || path.includes('scene')) {
      const sketchfabModel = clone.getObjectByName('Sketchfab_model')
      if (sketchfabModel) {
        sketchfabModel.rotation.set(-Math.PI / 2, 0, 0)
      } else {
        clone.rotation.x = -Math.PI / 2
      }
    }

    // For skin column, reset parent rotation so skin faces forward
    if (path.includes('splanchnology') && positionX === -2.4) {
      const sketchfabModel = clone.getObjectByName('Sketchfab_model')
      if (sketchfabModel) {
        sketchfabModel.rotation.set(0, 0, 0)
      }
    }

    // ────────────────────────────────────────────────────────────
    // STEP 1: Compute bounding box from ALL meshes (full body)
    //         BEFORE removing any meshes per column.
    // ────────────────────────────────────────────────────────────
    clone.updateWorldMatrix(true, true)
    
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        if (name.includes('floor') || name.includes('ground') || name.includes('plane') || name.includes('grid') || name.includes('helper') || name.includes('camera') || name.includes('light')) {
          return
        }
        if (child.geometry) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox()
          }
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
    
    if (!hasMesh) {
      box.setFromObject(clone)
    }

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

    // ────────────────────────────────────────────────────────────
    // STEP 2: NOW remove unwanted meshes per column (after bbox)
    // ────────────────────────────────────────────────────────────
    if (path.includes('splanchnology')) {
      if (positionX === -1.2) {
        // Organs column: remove skin, bones, skull – keep all organs including brain
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          const name = child.name.toLowerCase()
          if (name.includes('skin') || name.includes('bone') || name.includes('skull')) {
            toRemove.push(child)
          }
        })
        toRemove.forEach((child) => {
          if (child.parent) child.parent.remove(child)
        })
      } else if (positionX === -2.4) {
        // Skin column: remove everything except skin meshes
        const toRemove: THREE.Object3D[] = []
        clone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const name = child.name.toLowerCase()
            const isSkin = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
            if (!isSkin) {
              toRemove.push(child)
            }
          }
        })
        toRemove.forEach((child) => {
          if (child.parent) child.parent.remove(child)
        })
      }
    }

    // ────────────────────────────────────────────────────────────
    // STEP 3: Organ explosion offsets (no brain offset needed)
    // ────────────────────────────────────────────────────────────
    if (positionX === -1.2 && path.includes('splanchnology')) {
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh || (child as any).isMesh) {
          const name = child.name.toLowerCase()
          const parentName = child.parent ? child.parent.name.toLowerCase() : ''
          const mesh = child as THREE.Mesh
          const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
          
          const isBrain = name.includes('brain') || name.includes('cerebr') || parentName.includes('brain') || parentName.includes('cerebr')
          if (!isBrain) {
            const offset = getOrganVerticalOffset(name, matNames)
            if (offset !== 0) {
              child.position.y += offset / scaleFactor
            }
          }
        }
      })
    }

    clone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m: any) => m.clone ? m.clone() : m)
          } else if (mesh.material.clone) {
            mesh.material = mesh.material.clone()
          }
        }
      }
    })
    
    return clone
  }, [scene, positionX, path])

  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        const name = child.name.toLowerCase()
        let visible = true

        // Filter meshes based on checkboxes / activeSystems
        if (activeSystems) {
          if (path.includes('splanchnology')) {
            const isSkinMesh = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
            const isBrainMesh = name.includes('brain') || name.includes('cerebrum') || name.includes('cerebell') || name.includes('pons') || name.includes('medulla')
            const isHeartMesh = name.includes('heart') || name.includes('atrium') || name.includes('ventricle')
            const isSkeletonMesh = name.includes('skeletal') || name.includes('bone') || name.includes('skull') || name.includes('spine') || name.includes('pelvis') || name.includes('rib') || name.includes('radius') || name.includes('ulna')
            
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
            
            const isRespiratory = matNames.some((n: any) => n.includes('lung') || n.includes('bronchi') || n.includes('trachea') || n.includes('cartilage'))
            const isUrinary = matNames.some((n: any) => n.includes('organ.004') || n.includes('gland.004') || n.includes('kidney') || n.includes('bladder'))
            const isDigestive = matNames.some((n: any) => n.includes('intestine') || n.includes('organ.003') || n.includes('esophagus') || n.includes('stomach') || n.includes('liver')) || name.includes('stomach') || name.includes('liver') || name.includes('intestine')

            if (positionX === -2.4) {
              // Column 1: Body Skin/Integumentary
              visible = isSkinMesh && !!activeSystems.integumentary
            } else if (positionX === -1.2) {
              // Column 2: Visceral Organs (Exploded)
              if (isSkinMesh) visible = false
              else if (isSkeletonMesh) visible = false
              else if (name.includes('muscle') || name.includes('muscular')) visible = false
              else {
                visible = true
                if (isBrainMesh && !activeSystems.nervous) visible = false
                if (isHeartMesh && !activeSystems.cardiovascular) visible = false
                if (isRespiratory && !activeSystems.respiratory) visible = false
                if (isDigestive && !activeSystems.digestive) visible = false
                if (isUrinary && !activeSystems.digestive) visible = false
              }
            } else {
              visible = false
            }
            

          } else if (path.includes('scene')) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            const matNames = mats.map((m: any) => m ? m.name.toLowerCase() : '')
            
            const isVessels = matNames.some((n: any) => n.includes('artery') || n.includes('vein'))
            const isSkeleton = matNames.some((n: any) => n.includes('cartilage') || n.includes('ligament') || n.includes('muscle') || n.includes('skeletal') || n.includes('bone') || n.includes('default')) || !isVessels

            if (positionX === 0.0) {
              // Column 3: Skeleton (fallback)
              visible = isSkeleton && !!activeSystems.skeletal
            } else if (positionX === 1.2) {
              // Column 4: Cardiovascular
              visible = isVessels && !!activeSystems.cardiovascular
            } else {
              visible = false
            }
          } else if (path.includes('myology')) {
            // Column 5: Muscular
            if (positionX === 2.4) {
              const isMuscular = name.includes('muscular') || name.includes('muscle')
              visible = isMuscular && !!activeSystems.muscular
            } else {
              visible = false
            }
          }
        }

        mesh.visible = visible

        // Apply opacity and wireframe
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (m) {
            m.transparent = true
            const isSkin = name.includes('skin') || name.includes('integumentary') || name.includes('body') || name.includes('short') || name.includes('eye') || name.includes('head') || name.includes('lash') || name.includes('nail') || name.includes('hair')
            if (isSkin) {
              if (positionX === -2.4) {
                m.opacity = 1.0 // Solid textured skin/shorts/eyes
                m.wireframe = false
                m.depthWrite = true
              } else {
                // Realistic semi-transparent skin instead of blue hologram wireframe
                m.opacity = 0.15
                m.wireframe = false
                m.depthWrite = false
              }
            } else {
              m.opacity = opacity
              m.wireframe = wireframe
            }
            
            // Apply symptom analysis emissive highlight
            if (m.emissive) {
              m.emissive.set('#000000')
              m.emissiveIntensity = 0.0
            }
            if (symptomHighlightedRegions && symptomHighlightedRegions.length > 0) {
              const isHighlighted = symptomHighlightedRegions.some(reg => name.includes(reg.toLowerCase()))
              if (isHighlighted && m.emissive) {
                m.emissive.set('#ef4444') // bright red emissive highlight for affected symptoms
                m.emissiveIntensity = 3.0
              }
            }
            
            m.needsUpdate = true
          }
        })
      }
    })
  }, [cloned, opacity, wireframe, activeSystems, path, positionX, symptomHighlightedRegions])

  return <primitive object={cloned} />
}

// ---------------------------------------------------------
// FBX Model Wrapper Component
// ---------------------------------------------------------
function FBXModelWrapper({
  path,
  positionX,
  opacity,
  wireframe,
  activeSystems,
  symptomHighlightedRegions
}: {
  path: string
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  symptomHighlightedRegions?: string[]
}) {
  const fbx = useFBX(path)
  
  const { wrapper, innerClone } = useMemo(() => {
    // FBX skeleton uses Z-up. Wrap clone in parent Group; rotate wrapper, not clone.
    const clone = SkeletonUtils.clone(fbx)

    const wrapper = new THREE.Group()
    wrapper.rotation.x = -Math.PI / 2
    wrapper.add(clone)
    wrapper.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(wrapper)
    const size = box.getSize(new THREE.Vector3())
    const targetHeight = 2.0
    const scaleFactor = targetHeight / (size.y || 1)
    wrapper.scale.setScalar(scaleFactor)
    wrapper.updateMatrixWorld(true)

    const box2 = new THREE.Box3().setFromObject(wrapper)
    const center2 = box2.getCenter(new THREE.Vector3())
    wrapper.position.set(positionX - center2.x, -box2.min.y - 1.0, -center2.z)

    const boneMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8dcc8'),
      roughness: 0.60,
      metalness: 0.05,
      emissive: new THREE.Color('#221e16'),
      emissiveIntensity: 0.15,
    })

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (child instanceof THREE.Mesh || (child as any).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        mesh.material = boneMaterial.clone()
      }
    })

    return { wrapper, innerClone: clone }
  }, [fbx, positionX])

  useEffect(() => {
    innerClone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        let visible = true

        if (activeSystems) {
          visible = !!activeSystems.skeletal
        }

        mesh.visible = visible

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m: any) => {
          if (m) {
            m.transparent = true
            m.opacity = opacity
            m.wireframe = wireframe
            
            if (m.emissive) {
              m.emissive.set('#000000')
              m.emissiveIntensity = 0.0
            }
            if (symptomHighlightedRegions && symptomHighlightedRegions.length > 0) {
              const isHighlighted = symptomHighlightedRegions.some(reg => child.name.toLowerCase().includes(reg.toLowerCase()))
              if (isHighlighted && m.emissive) {
                m.emissive.set('#ef4444')
                m.emissiveIntensity = 3.0
              }
            }
            
            m.needsUpdate = true
          }
        })
      }
    })
  }, [innerClone, opacity, wireframe, activeSystems, symptomHighlightedRegions])

  return <primitive object={wrapper} />
}

// ---------------------------------------------------------
// Unified Model Instance Component
// ---------------------------------------------------------
function ModelInstance({
  path,
  positionX,
  opacity,
  wireframe,
  activeSystems,
  symptomHighlightedRegions
}: {
  path: string
  positionX: number
  opacity: number
  wireframe: boolean
  activeSystems?: SystemToggles
  symptomHighlightedRegions?: string[]
}) {
  const isFbx = path.toLowerCase().endsWith('.fbx')
  if (isFbx) {
    return (
      <FBXModelWrapper
        path={path}
        positionX={positionX}
        opacity={opacity}
        wireframe={wireframe}
        activeSystems={activeSystems}
        symptomHighlightedRegions={symptomHighlightedRegions}
      />
    )
  }
  return (
    <GLTFModelWrapper
      path={path}
      positionX={positionX}
      opacity={opacity}
      wireframe={wireframe}
      activeSystems={activeSystems}
      symptomHighlightedRegions={symptomHighlightedRegions}
    />
  )
}

// ---------------------------------------------------------
// Side-by-Side Model Components
// ---------------------------------------------------------
function SideBySideModel({ 
  path, 
  system,
  positionX, 
  opacity = 1.0, 
  wireframe = false,
  activeSystems,
  symptomHighlightedRegions
}: { 
  path: string
  system?: 'skeletal_nervous' | 'cardiovascular_visceral' | 'muscular'
  positionX: number
  opacity?: number
  wireframe?: boolean 
  activeSystems?: SystemToggles
  symptomHighlightedRegions?: string[]
}) {
  return (
    <ModelInstance
      path={path}
      positionX={positionX}
      opacity={opacity}
      wireframe={wireframe}
      activeSystems={activeSystems}
      symptomHighlightedRegions={symptomHighlightedRegions}
    />
  )
}

// ---------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------
export function BodyModel({ affectedRegions, opacity = 0.85, wireframe = false, activeSystems, vitals, symptomHighlightedRegions }: BodyModelProps) {
  return (
    <div className="w-full h-full relative group bg-[#030712] overflow-hidden">
      {/* 3D Viewport Canvas */}
      <Canvas camera={{ position: [0, 0.2, 4.6], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#060a14']} />
        
        {/* Realistic Studio Lighting */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[10, 15, 5]} intensity={1.8} color="#ffffff" />
        <directionalLight position={[-10, 10, -5]} intensity={1.0} color="#e8e0d8" />
        <spotLight position={[0, 12, 0]} intensity={2.5} angle={0.8} penumbra={1} color="#ffffff" />
        <spotLight position={[0, -5, 5]} intensity={1.0} angle={0.8} penumbra={1} color="#f5f0eb" />

        <Suspense fallback={null}>
          {/* Column 1: Body Skin/Integumentary */}
          <Suspense fallback={null}>
            <SideBySideModel 
              path="/ai-in-healthcare/asset-01/splanchnology.glb" 
              positionX={-2.4} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems}
              symptomHighlightedRegions={symptomHighlightedRegions}
            />
          </Suspense>

          {/* Column 2: Visceral Organs (from splanchnology.glb, exploded) */}
          <Suspense fallback={null}>
            <SideBySideModel 
              path="/ai-in-healthcare/asset-01/splanchnology.glb" 
              positionX={-1.2} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems}
              symptomHighlightedRegions={symptomHighlightedRegions}
            />
          </Suspense>
          
          {/* Column 3: Skeletal System (from SkeletalSystem100.fbx) */}
          <Suspense fallback={null}>
            <SideBySideModel 
              path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" 
              positionX={0.0} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems}
              symptomHighlightedRegions={symptomHighlightedRegions}
            />
          </Suspense>

          {/* Column 4: Cardiovascular vessels (from scene.gltf) */}
          <Suspense fallback={null}>
            <SideBySideModel 
              path="/ai-in-healthcare/asset-01/scene.gltf" 
              positionX={1.2} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems}
              symptomHighlightedRegions={symptomHighlightedRegions}
            />
          </Suspense>

          {/* Column 5: Muscular system (from myology.glb) */}
          <Suspense fallback={null}>
            <SideBySideModel 
              path="/ai-in-healthcare/asset-01/myology.glb" 
              positionX={2.4} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems}
              symptomHighlightedRegions={symptomHighlightedRegions}
            />
          </Suspense>
        </Suspense>

        {/* Render interactive organ labels & anomaly markers ONLY after symptoms are analyzed */}
        {(affectedRegions && affectedRegions.length > 0) && ORGANS.map(organ => {
          // Find if this organ is affected in any of the active regions
          const matchingRegion = affectedRegions.find(region => {
            const organName = region.bodyRegion.toLowerCase().trim()
            const mappedNodes = ORGAN_MAP[organName] || [organName]
            return mappedNodes.includes(organ.id) || organName === organ.id
          })

          // Vertical offsets that match the GLTFModelWrapper organ explosion in column 2
          // These align labels with the exploded organ meshes in split view
          const ORGAN_DY: Record<string, number> = {
            'brain':        0.0,
            'nasal_cavity': 0.0,
            'throat':       0.3,
            'trachea':      0.3,
            'lung_left':    0.3,
            'lung_right':   0.3,
            'heart':        0.3,
            'aorta':        0.3,
            'liver':        0.0,
            'stomach':      0.0,
            'gallbladder':  0.0,
            'spleen':       0.0,
            'pancreas':     0.0,
            'kidney_left':  -0.4,
            'kidney_right': -0.4,
            'intestines':   -0.7,
            'appendix':     -0.7,
            'bladder':      -0.7,
            'spinal_cord':  0.0,
            'skin':         0.0,
            'lymph_nodes':  0.0,
          }

          const [bx, by, bz] = organ.position
          const dx = -1.2
          const dy = ORGAN_DY[organ.id] ?? 0
          const adjustedPosition: [number, number, number] = [bx + dx, by + dy, bz]

          if (matchingRegion) {
            return (
              <PulsingMarker
                key={`anomaly-${organ.id}`}
                position={adjustedPosition}
                confidence={matchingRegion.confidence}
                condition={matchingRegion.condition}
                reasoning={matchingRegion.reasoning}
                organName={organ.name}
              />
            )
          }

          // Organ is not affected — show a subtle label for context
          return (
            <OrganLabel 
              key={`label-${organ.id}`} 
              organ={{
                ...organ,
                position: adjustedPosition
              }} 
              isAffected={false} 
              showLabel={false} 
            />
          )
        })}

        {/* Neutral dark grid platform beneath the standing models */}
        <gridHelper 
          args={[8.0, 20, '#1e293b', '#0f172a']} 
          position={[0, -0.99, 0]}
        />
        <mesh position={[0, -0.995, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.0, 2.0]} />
          <meshStandardMaterial 
            color="#0ea5e9" 
            transparent 
            opacity={0.05} 
            side={THREE.DoubleSide}
          />
        </mesh>

        <ContactShadows 
          position={[0, -1.0, 0]} 
          opacity={0.85} 
          scale={7} 
          blur={3} 
          far={4} 
          color="#00ffff"
        />

        <OrbitControls
          enablePan={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.3}
          minDistance={1.0}
          maxDistance={8}
          target={[0, 0.0, 0]}
        />
      </Canvas>

      {/* Futuristic Biometrics HUD Overlay on bottom left of screen */}
      {vitals && (
        <div className="absolute bottom-6 left-6 z-20 pointer-events-auto bg-black/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded shadow-[0_0_20px_rgba(6,182,212,0.15)] w-60 font-mono">
          <div className="text-[10px] tracking-widest text-cyan-400 border-b border-cyan-500/20 pb-1.5 mb-2.5 font-bold flex justify-between">
            <span>FULL BODY DIAGNOSTIC</span>
            <span className="animate-pulse text-red-500">● LIVE</span>
          </div>
          <div className="space-y-2 text-[11px] text-gray-300">
            <div className="flex justify-between items-center">
              <span>HEART RATE:</span>
              <span className="text-red-400 font-bold">{vitals.hr} BPM</span>
            </div>
            <div className="flex justify-between items-center">
              <span>BODY TEMP:</span>
              <span className="text-orange-400 font-bold">{vitals.temp}°C</span>
            </div>
            <div className="flex justify-between items-center">
              <span>OXYGEN (SpO2):</span>
              <span className="text-blue-400 font-bold">{vitals.spo2}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>BLOOD PRESSURE:</span>
              <span className="text-purple-400 font-bold">{vitals.bp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
