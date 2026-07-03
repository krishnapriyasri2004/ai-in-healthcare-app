'use client'

import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Html, Line } from '@react-three/drei'
import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'

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
}

interface BodyOrgan {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  geometry: 'sphere' | 'box' | 'capsule'
  baseColor: string
}

// Map logical organ names from AI to our 3D nodes
const ORGAN_MAP: Record<string, string[]> = {
  'heart': ['heart'],
  'lungs': ['lung_left', 'lung_right'],
  'brain': ['brain'],
  'liver': ['liver'],
  'kidneys': ['kidney_left', 'kidney_right'],
  'stomach': ['stomach'],
  'intestines': ['intestines'],
  'throat': ['throat'],
  'nasal_cavity': ['nasal_cavity'],
  'trachea': ['trachea'],
  'bronchi': ['lung_left', 'lung_right']
}

// Map each organ to a body system category so the Anatomy Explorer toggles work
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

// Realistic organ colors
const ORGANS: BodyOrgan[] = [
  { id: 'brain', name: 'Brain', position: [0, 2.5, 0], size: [0.3, 0.25, 0.3], geometry: 'sphere', baseColor: '#f5d0c5' },
  { id: 'throat', name: 'Throat', position: [0, 1.9, 0], size: [0.1, 0.3, 0.1], geometry: 'capsule', baseColor: '#d68b85' },
  { id: 'nasal_cavity', name: 'Nasal Cavity', position: [0, 2.3, 0.15], size: [0.1, 0.1, 0.1], geometry: 'box', baseColor: '#d68b85' },
  { id: 'trachea', name: 'Trachea', position: [0, 1.5, 0], size: [0.08, 0.4, 0.08], geometry: 'capsule', baseColor: '#f0ece1' },
  { id: 'lung_left', name: 'Left Lung', position: [-0.3, 1.1, 0], size: [0.25, 0.5, 0.25], geometry: 'capsule', baseColor: '#f7b0a8' },
  { id: 'lung_right', name: 'Right Lung', position: [0.3, 1.1, 0], size: [0.25, 0.5, 0.25], geometry: 'capsule', baseColor: '#f7b0a8' },
  { id: 'heart', name: 'Heart', position: [-0.1, 1.0, 0.1], size: [0.2, 0.2, 0.15], geometry: 'sphere', baseColor: '#a63434' },
  { id: 'liver', name: 'Liver', position: [0.2, 0.5, 0.1], size: [0.4, 0.2, 0.25], geometry: 'box', baseColor: '#5c2d27' },
  { id: 'stomach', name: 'Stomach', position: [-0.2, 0.4, 0.1], size: [0.25, 0.2, 0.2], geometry: 'sphere', baseColor: '#d48888' },
  { id: 'kidney_left', name: 'Left Kidney', position: [-0.2, 0.5, -0.15], size: [0.12, 0.2, 0.12], geometry: 'capsule', baseColor: '#6e3831' },
  { id: 'kidney_right', name: 'Right Kidney', position: [0.2, 0.5, -0.15], size: [0.12, 0.2, 0.12], geometry: 'capsule', baseColor: '#6e3831' },
  { id: 'intestines', name: 'Intestines', position: [0, 0, 0], size: [0.4, 0.4, 0.25], geometry: 'sphere', baseColor: '#d9a69a' },
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
// Real Anatomy GLTF Loader
// ---------------------------------------------------------
function RealAnatomyModel({ activeOrgans }: { activeOrgans: Array<{ id: string; severity: string }> }) {
  const { scene } = useGLTF('/anatomy.glb')
  
  const colors = useMemo(() => ({
    high: new THREE.Color('#ff0033'),   // Deep aggressive red
    medium: new THREE.Color('#ff7700'), // Warning orange
    low: new THREE.Color('#ffdd00')     // Minor yellow
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const intensity = (Math.sin(t * 5) * 0.5 + 0.5) * 2

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        const affectedOrgan = activeOrgans.find(o => name.includes(o.id) || name.includes(o.id.split('_')[0]))

        if (affectedOrgan) {
          if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material
          
          const severity = affectedOrgan.severity as 'high' | 'medium' | 'low'
          const baseColor = colors[severity] || colors.high
          const emissiveBase = severity === 'high' ? 1.5 : severity === 'medium' ? 0.8 : 0.4
          
          const materialKey = `alertMaterial_${severity}`

          if (!child.userData[materialKey]) {
            child.userData[materialKey] = new THREE.MeshStandardMaterial({
              color: baseColor,
              emissive: baseColor,
              emissiveIntensity: intensity + emissiveBase,
              transparent: true,
              opacity: 0.9,
              blending: THREE.AdditiveBlending
            })
          } else {
            child.userData[materialKey].emissiveIntensity = intensity + emissiveBase
          }
          child.material = child.userData[materialKey]
        } else {
             // Identify the main body/skin mesh
             if (name.includes('body') || name.includes('skin') || name.includes('human') || name.includes('mesh')) {
                if (!child.userData.holoSkinMaterial) {
                  child.userData.holoSkinMaterial = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color('#0022ff'),
                    emissive: new THREE.Color('#0044ff'),
                    emissiveIntensity: 0.2,
                    transmission: 0.95,
                    opacity: 0.35,
                    metalness: 0.8,
                    roughness: 0.1,
                    ior: 1.2,
                    thickness: 0.5,
                    transparent: true,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                }
                child.material = child.userData.holoSkinMaterial
             } else {
                if (!child.userData.originalMaterial) child.userData.originalMaterial = child.material
                
                const isHeart = name.includes('heart')

                if (isHeart) {
                    // Realistic colors for the heart
                    if (!child.userData.realisticHeartMaterial) {
                        const origMat = child.userData.originalMaterial as THREE.MeshStandardMaterial;
                        const origColor = origMat.color ? origMat.color.clone() : new THREE.Color('#a63434');
                        child.userData.realisticHeartMaterial = new THREE.MeshStandardMaterial({
                          color: origColor,
                          emissive: origColor,
                          emissiveIntensity: 0.1, // Subtle realistic lighting
                          roughness: 0.4,
                          metalness: 0.1,
                        })
                    }
                    child.material = child.userData.realisticHeartMaterial
                } else {
                    // Glows in cyan and electric blue for all other anatomy
                    if (!child.userData.holoOrganMaterial) {
                        child.userData.holoOrganMaterial = new THREE.MeshStandardMaterial({
                          color: new THREE.Color('#00ffff'),
                          emissive: new THREE.Color('#0088ff'),
                          emissiveIntensity: 0.6,
                          transparent: true,
                          opacity: 0.85,
                          roughness: 0.1,
                          metalness: 0.8,
                        })
                    }
                    child.material = child.userData.holoOrganMaterial
                }
             }
          }
      }
    })
  })

  // GLB model origin is at the feet. Shift it up so the torso is at center.
  return <primitive object={scene} position={[0, -0.2, 0]} scale={1} />
}

// ---------------------------------------------------------
// Procedural Fallback & Organ Nodes
// ---------------------------------------------------------
function OrganNode({ organ, isAffected, showLabel }: { organ: BodyOrgan; isAffected: boolean; showLabel: boolean }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  
  const baseColor = useMemo(() => new THREE.Color(organ.baseColor), [organ.baseColor])
  
  useFrame((state) => {
    if (materialRef.current && !isAffected) {
      materialRef.current.emissive = new THREE.Color('#000000')
      materialRef.current.emissiveIntensity = 0
      materialRef.current.color = baseColor
    }
  })

  return (
    <group position={organ.position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
      >
        {organ.geometry === 'sphere' && <sphereGeometry args={[organ.size[0], 32, 32]} />}
        {organ.geometry === 'box' && <boxGeometry args={organ.size} />}
        {organ.geometry === 'capsule' && <capsuleGeometry args={[organ.size[0], organ.size[1], 8, 16]} />}
        
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={isAffected ? 0.3 : 1}
        />
      </mesh>

      {/* Show organ name label when its system toggle is ON or when hovered */}
      {(showLabel || hovered) && (
        <Html distanceFactor={5} position={[organ.size[0] + 0.15, 0, 0]} zIndexRange={[50, 0]}>
          <div className={`
            flex items-center gap-2 px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg 
            whitespace-nowrap pointer-events-none transition-all duration-300
            ${isAffected 
              ? 'bg-red-900/80 border border-red-500/60 text-red-200 scale-110' 
              : 'bg-black/70 border border-cyan-800/50 text-cyan-300 scale-100'}
          `}>
            {isAffected && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
            <span className="font-semibold text-[10px] uppercase tracking-wider">{organ.name}</span>
          </div>
        </Html>
      )}

      {/* Connecting line to label */}
      {(showLabel || hovered) && (
        <Line 
          points={[[0, 0, 0], [organ.size[0] + 0.15, 0, 0]]} 
          color={isAffected ? '#ef4444' : '#00cccc'} 
          lineWidth={1}
          dashed
        />
      )}
    </group>
  )
}

// ---------------------------------------------------------
// Pulsing Marker Component
// ---------------------------------------------------------
function PulsingMarker({ position, confidence, condition, reasoning }: { position: [number, number, number], confidence: string, condition: string, reasoning: string }) {
  const markerRef = useRef<THREE.Mesh>(null)
  
  const color = confidence === 'high' ? '#ef4444' : confidence === 'medium' ? '#f97316' : '#eab308'
  const glowColor = confidence === 'high' ? 'rgba(239, 68, 68, 0.8)' : confidence === 'medium' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(234, 179, 8, 0.8)'

  useFrame((state) => {
      if (markerRef.current) {
          const t = state.clock.elapsedTime
          const scale = 1 + Math.sin(t * 8) * 0.15
          markerRef.current.scale.set(scale, scale, scale)
      }
  })

  // We add a subtle y offset so it sits nicely in the middle of the organ
  const adjustedPosition: [number, number, number] = [position[0], position[1], position[2] + 0.1]

  return (
    <group position={adjustedPosition}>
       {/* 3D Core Marker */}
       <mesh ref={markerRef}>
         <sphereGeometry args={[0.06, 16, 16]} />
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.9} />
       </mesh>

       {/* HTML Overlay (Always visible) */}
       <Html distanceFactor={5} position={[0.1, 0, 0]} zIndexRange={[100, 0]}>
          <div className="relative group flex items-start gap-2">
             <div className="w-4 h-4 rounded-full absolute -left-2 -top-2 animate-ping" style={{ backgroundColor: color }} />
             <div className="w-2 h-2 rounded-full absolute -left-1 -top-1" style={{ backgroundColor: '#ffffff', boxShadow: `0 0 10px ${glowColor}` }} />
             
             {/* Permanent Label Container */}
             <div className="ml-3 w-48 p-2 rounded-lg bg-black/80 backdrop-blur-md border shadow-[0_0_15px_rgba(0,0,0,0.5)] text-white pointer-events-auto" style={{ borderColor: color }}>
                <h4 className="font-bold text-xs leading-tight text-white mb-1">{condition}</h4>
                <div className={`text-[9px] font-mono tracking-widest uppercase mb-1.5`} style={{ color: color }}>
                   Confidence: {confidence}
                </div>
                <p className="text-[10px] text-gray-300 leading-snug line-clamp-3">{reasoning}</p>
             </div>
          </div>
       </Html>
    </group>
  )
}

// ---------------------------------------------------------
// System Labels Layer — renders organ name labels at their
// fixed 3D positions calibrated to the real anatomy.glb model.
// Works for BOTH the real GLB path and the procedural fallback.
// ---------------------------------------------------------

// Label positions calibrated for the anatomy.glb model rendered at y=-0.2, scale=1
// These are world-space coordinates where each organ appears on the real GLB model.
const GLB_LABEL_POSITIONS: Record<string, { position: [number, number, number]; side: 'left' | 'right' }> = {
  'brain':        { position: [0,    1.55, 0.05],  side: 'right' },
  'nasal_cavity': { position: [0,    1.38, 0.12],  side: 'right' },
  'throat':       { position: [0,    1.18, 0.05],  side: 'right' },
  'trachea':      { position: [0,    1.0,  0.05],  side: 'right' },
  'lung_left':    { position: [-0.18, 0.82, 0.05], side: 'left'  },
  'lung_right':   { position: [0.18,  0.82, 0.05], side: 'right' },
  'heart':        { position: [-0.06, 0.75, 0.1],  side: 'left'  },
  'liver':        { position: [0.15,  0.55, 0.08], side: 'right' },
  'stomach':      { position: [-0.12, 0.52, 0.08], side: 'left'  },
  'kidney_left':  { position: [-0.15, 0.48, -0.05],side: 'left'  },
  'kidney_right': { position: [0.15,  0.48, -0.05],side: 'right' },
  'intestines':   { position: [0,     0.32, 0.05], side: 'right' },
}

function SystemLabels({ activeSystems, activeOrganIds }: { activeSystems?: SystemToggles, activeOrganIds: string[] }) {
  if (!activeSystems) return null

  return (
    <group>
      {ORGANS.map((organ) => {
        const system = ORGAN_SYSTEM_MAP[organ.id]
        if (!system || !activeSystems[system]) return null

        const isAffected = activeOrganIds.includes(organ.id)
        const labelInfo = GLB_LABEL_POSITIONS[organ.id]
        if (!labelInfo) return null

        const lineLen = 0.35
        const xDir = labelInfo.side === 'right' ? 1 : -1
        const labelOffset: [number, number, number] = [lineLen * xDir, 0, 0]

        return (
          <group key={organ.id} position={labelInfo.position}>
            {/* Label */}
            <Html distanceFactor={5} position={labelOffset} zIndexRange={[50, 0]}>
              <div className={`
                flex items-center gap-2 px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg 
                whitespace-nowrap pointer-events-none transition-all duration-300
                ${isAffected 
                  ? 'bg-red-900/80 border border-red-500/60 text-red-200 scale-110' 
                  : 'bg-black/70 border border-cyan-800/50 text-cyan-300 scale-100'}
              `}>
                {isAffected && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                <span className="font-semibold text-[10px] uppercase tracking-wider">{organ.name}</span>
              </div>
            </Html>

            {/* Connecting line from body to label */}
            <Line 
              points={[[0, 0, 0], labelOffset]} 
              color={isAffected ? '#ef4444' : '#00cccc'} 
              lineWidth={1}
              dashed
            />
          </group>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------
// Humanoid Avatar Wrapper (Realistic Transparent Body)
// ---------------------------------------------------------
function AvatarBody({ opacity = 1, wireframe = false }: { opacity?: number, wireframe?: boolean }) {
  const { scene } = useGLTF('/anatomy.glb')
  
  const realisticSkinMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: wireframe ? '#0ea5e9' : '#f5d0c5', // Flesh tone
    transmission: wireframe ? 0 : 1.0,        // Fully transmissive to see inside
    opacity: wireframe ? 0.3 : opacity,
    metalness: 0.1,
    roughness: 0.25,                          // Slightly rough like skin
    ior: 1.4,                                 // IOR of tissue/water
    thickness: 1.5,                           // Gives a sense of depth to the flesh
    clearcoat: wireframe ? 0 : 0.2,           // Slight sweat/gloss
    clearcoatRoughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    wireframe: wireframe
  }), [opacity, wireframe])

  useFrame(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = realisticSkinMaterial
      }
    })
  })

  return <primitive object={scene} position={[0, -0.2, 0]} scale={2.2} />
}

function ProceduralAnatomyModel({ activeOrganIds, opacity, wireframe, activeSystems }: { activeOrganIds: string[], opacity?: number, wireframe?: boolean, activeSystems?: SystemToggles }) {
  return (
    <group position={[0, -0.5, 0]}>
      <Suspense fallback={
        <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[0.5, 2, 16, 32]} />
          <meshBasicMaterial color="#f5d0c5" wireframe={wireframe} transparent opacity={opacity} />
        </mesh>
      }>
        <AvatarBody opacity={opacity} wireframe={wireframe} />
      </Suspense>

      {ORGANS.map((organ) => {
        const system = ORGAN_SYSTEM_MAP[organ.id]
        const systemActive = activeSystems ? (system ? activeSystems[system] : false) : false
        return (
          <OrganNode
            key={organ.id}
            organ={organ}
            isAffected={activeOrganIds.includes(organ.id)}
            showLabel={systemActive}
          />
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------
export function BodyModel({ affectedRegions, opacity = 1, wireframe = false, activeSystems }: BodyModelProps) {
  const activeOrgans = affectedRegions.flatMap(
    (region) => {
      const regionId = region.bodyRegion.toLowerCase().replace(' ', '_');
      const mappedIds = ORGAN_MAP[regionId] || [regionId]
      return mappedIds.map(id => ({ id, severity: region.confidence }))
    }
  )

  const markers = affectedRegions.map(region => {
      const regionId = region.bodyRegion.toLowerCase().replace(' ', '_');
      const mappedIds = ORGAN_MAP[regionId] || [regionId]
      
      let position: [number, number, number] = [0, 1.5, 0]
      
      for (const mapId of mappedIds) {
         const organ = ORGANS.find(o => o.id === mapId) || ORGANS.find(o => o.name.toLowerCase().includes(mapId))
         if (organ) {
            position = [organ.position[0], organ.position[1] - 0.5, organ.position[2]]
            break
         }
      }
      
      return {
          ...region,
          position
      }
  })

  return (
    <div className="w-full h-full min-h-[100vh] relative group bg-[#030712] overflow-hidden">
      <Canvas camera={{ position: [0, 1.2, 4], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#030712']} />
        
        {/* Holographic Cinematic Lighting */}
        <ambientLight intensity={0.5} color="#00ffff" />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00ffff" />
        <directionalLight position={[-10, 5, -5]} intensity={2} color="#0044ff" />
        <spotLight position={[0, 10, 0]} intensity={3} angle={0.6} penumbra={1} color="#00ffff" />
        <spotLight position={[0, -10, 0]} intensity={2} angle={0.8} penumbra={1} color="#0088ff" />

        {/* Attempt to load /anatomy.glb, otherwise gracefully fallback to Procedural */}
        <ModelErrorBoundary fallback={<ProceduralAnatomyModel activeOrganIds={activeOrgans.map(o => o.id)} opacity={opacity} wireframe={wireframe} activeSystems={activeSystems} />}>
          <Suspense fallback={<ProceduralAnatomyModel activeOrganIds={activeOrgans.map(o => o.id)} opacity={opacity} wireframe={wireframe} activeSystems={activeSystems} />}>
             <RealAnatomyModel activeOrgans={activeOrgans} />
          </Suspense>
        </ModelErrorBoundary>

        {/* System labels — rendered at organ positions, works for both model paths */}
        <SystemLabels activeSystems={activeSystems} activeOrganIds={activeOrgans.map(o => o.id)} />

        {/* Render interactive markers on top of the models */}
        {markers.map((m, i) => (
           <PulsingMarker 
             key={i} 
             position={m.position} 
             confidence={m.confidence} 
             condition={m.condition} 
             reasoning={m.reasoning} 
           />
        ))}

        <Environment preset="city" />

        {/* Holographic glowing base */}
        <ContactShadows 
          position={[0, -2.7, 0]} 
          opacity={0.8} 
          scale={12} 
          blur={3} 
          far={4} 
          color="#00ffff"
        />

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 1.3}
          minDistance={2}
          maxDistance={7}
          target={[0, 1.2, 0]}
        />
      </Canvas>
    </div>
  )
}
