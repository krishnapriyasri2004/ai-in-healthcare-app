'use client'

import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect } from 'react'
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
  vitals?: { temp: string; hr: string; spo2: string; bp: string }
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
// Real Anatomy GLTF Loader with Internal Label & Marker Rendering
// ---------------------------------------------------------
function RealAnatomyModel({ 
  activeOrgans, 
  activeSystems, 
  affectedRegions 
}: { 
  activeOrgans: Array<{ id: string; severity: string }>, 
  activeSystems?: SystemToggles,
  affectedRegions: RegionInfo[] 
}) {
  const { scene } = useGLTF('/anatomy.glb')
  const [centers, setCenters] = useState<Record<string, [number, number, number]>>({})
  
  const colors = useMemo(() => ({
    high: new THREE.Color('#ff0033'),
    medium: new THREE.Color('#ff7700'),
    low: new THREE.Color('#ffdd00')
  }), [])

  useEffect(() => {
    if (!scene) return
    scene.updateMatrixWorld(true)
    const computedCenters: Record<string, [number, number, number]> = {}
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase()
        for (const organId of Object.keys(ORGAN_MAP)) {
          const mappedNames = ORGAN_MAP[organId]
          if (mappedNames.some(mName => name.includes(mName))) {
            child.geometry.computeBoundingBox()
            const center = new THREE.Vector3()
            child.geometry.boundingBox!.getCenter(center)
            center.applyMatrix4(child.matrixWorld)
            computedCenters[organId] = [center.x, center.y, center.z]
          }
        }
      }
    })
    setCenters(computedCenters)
  }, [scene])

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
                    if (!child.userData.realisticHeartMaterial) {
                        const origMat = child.userData.originalMaterial as THREE.MeshStandardMaterial;
                        const origColor = origMat.color ? origMat.color.clone() : new THREE.Color('#a63434');
                        child.userData.realisticHeartMaterial = new THREE.MeshStandardMaterial({
                          color: origColor,
                          emissive: origColor,
                          emissiveIntensity: 0.1,
                          roughness: 0.4,
                          metalness: 0.1,
                        })
                    }
                    child.material = child.userData.realisticHeartMaterial
                } else {
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

  return (
    <group position={[0, -0.2, 0]} scale={1}>
      <primitive object={scene} />
      
      {/* 3D System Labels anchored precisely to mesh centers */}
      {activeSystems && ORGANS.map((organ) => {
        const system = ORGAN_SYSTEM_MAP[organ.id]
        if (!system || !activeSystems[system]) return null

        const isAffected = activeOrgans.some(o => o.id === organ.id)
        const pos = centers[organ.id]
        if (!pos) return null

        const lineLen = 0.55
        const isRight = organ.position[0] >= 0
        const labelOffset: [number, number, number] = [lineLen * (isRight ? 1 : -1), 0.1, 0]

        return (
          <group key={organ.id} position={pos}>
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
        )
      })}

      {/* Render interactive markers at precise mesh centers */}
      {affectedRegions.map((m, idx) => {
        const regionId = m.bodyRegion.toLowerCase().replace(' ', '_');
        const mappedIds = ORGAN_MAP[regionId] || [regionId]
        
        let pos: [number, number, number] = [0, 1.5, 0]
        for (const mapId of mappedIds) {
          if (centers[mapId]) {
            pos = centers[mapId]
            break
          }
        }

        return (
          <PulsingMarker 
            key={idx} 
            position={pos} 
            confidence={m.confidence} 
            condition={m.condition} 
            reasoning={m.reasoning}
            organName={regionId}
          />
        )
      })}
    </group>
  )
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

  const lineLen = 0.55
  const isRight = organ.position[0] >= 0
  const labelOffset: [number, number, number] = [lineLen * (isRight ? 1 : -1), 0.1, 0]

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
// HUD-style Pulsing Marker Component
// ---------------------------------------------------------
function PulsingMarker({ 
  position, 
  confidence, 
  condition, 
  reasoning,
  organName
}: { 
  position: [number, number, number]
  confidence: string
  condition: string
  reasoning: string
  organName: string
}) {
  const markerRef = useRef<THREE.Mesh>(null)
  
  const color = confidence === 'high' ? '#ef4444' : confidence === 'medium' ? '#f97316' : '#eab308'
  const glowColor = confidence === 'high' ? 'rgba(239, 68, 68, 0.6)' : confidence === 'medium' ? 'rgba(249, 115, 22, 0.6)' : 'rgba(234, 179, 8, 0.6)'

  useFrame((state) => {
      if (markerRef.current) {
          const t = state.clock.elapsedTime
          const scale = 1 + Math.sin(t * 8) * 0.15
          markerRef.current.scale.set(scale, scale, scale)
      }
  })

  // Format position slightly
  const adjustedPosition: [number, number, number] = [position[0], position[1], position[2] + 0.1]
  const isRight = position[0] >= 0
  const lineLen = isRight ? 0.65 : -0.65
  const labelOffset: [number, number, number] = [lineLen, 0.15, 0]

  return (
    <group position={adjustedPosition}>
       {/* 3D Core Dot on Organ */}
       <mesh ref={markerRef}>
         <sphereGeometry args={[0.045, 16, 16]} />
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.95} />
       </mesh>

       {/* HUD Diagonal pointer line */}
       <Line 
         points={[[0, 0, 0], [labelOffset[0], labelOffset[1], labelOffset[2]]]} 
         color={color} 
         lineWidth={1.5}
       />

       {/* HUD Details Panel */}
       <Html distanceFactor={5} position={labelOffset} zIndexRange={[100, 0]}>
          <div 
            className="w-56 p-3 rounded bg-black/90 border-t-2 shadow-[0_0_20px_rgba(0,0,0,0.85)] text-white pointer-events-auto flex flex-col gap-1 transition-all duration-300 font-sans"
            style={{ 
              borderColor: color, 
              borderLeft: isRight ? `1px solid ${color}33` : 'none',
              borderRight: !isRight ? `1px solid ${color}33` : 'none',
              boxShadow: `0 0 15px ${glowColor}`
            }}
          >
             <div className="flex justify-between items-center border-b border-white/10 pb-1">
                <span className="font-mono text-[8px] tracking-widest text-gray-400 uppercase">SYSTEM ANOMALY</span>
                <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/15" style={{ color }}>
                   {confidence}
                </span>
             </div>
             
             <h3 className="font-bold text-[10px] uppercase tracking-wider text-white mt-0.5">
                {organName.replace('_', ' ')}
             </h3>

             <div className="font-semibold text-xs leading-tight mt-0.5" style={{ color }}>
                {condition}
             </div>

             <p className="text-[10px] text-gray-400 leading-snug mt-1 border-t border-white/5 pt-1 line-clamp-3">
                {reasoning}
             </p>
          </div>
       </Html>
    </group>
  )
}

// ---------------------------------------------------------
// Humanoid Avatar Wrapper (Realistic Transparent Body)
// ---------------------------------------------------------
function AvatarBody({ opacity = 1, wireframe = false }: { opacity?: number, wireframe?: boolean }) {
  const { scene } = useGLTF('/anatomy.glb')
  
  const realisticSkinMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: wireframe ? '#0ea5e9' : '#f5d0c5',
    transmission: wireframe ? 0 : 1.0,
    opacity: wireframe ? 0.3 : opacity,
    metalness: 0.1,
    roughness: 0.25,
    ior: 1.4,
    thickness: 1.5,
    clearcoat: wireframe ? 0 : 0.2,
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

function ProceduralAnatomyModel({ 
  activeOrganIds, 
  opacity, 
  wireframe, 
  activeSystems,
  affectedRegions 
}: { 
  activeOrganIds: string[], 
  opacity?: number, 
  wireframe?: boolean, 
  activeSystems?: SystemToggles,
  affectedRegions: RegionInfo[]
}) {
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

      {affectedRegions.map((m, idx) => {
        const regionId = m.bodyRegion.toLowerCase().replace(' ', '_');
        const mappedIds = ORGAN_MAP[regionId] || [regionId]
        
        let pos: [number, number, number] = [0, 1.5, 0]
        for (const mapId of mappedIds) {
          const organ = ORGANS.find(o => o.id === mapId)
          if (organ) {
            pos = organ.position
            break
          }
        }

        return (
          <PulsingMarker 
            key={idx} 
            position={pos} 
            confidence={m.confidence} 
            condition={m.condition} 
            reasoning={m.reasoning}
            organName={regionId}
          />
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------
// Main Canvas Component
// ---------------------------------------------------------
export function BodyModel({ affectedRegions, opacity = 1, wireframe = false, activeSystems, vitals }: BodyModelProps) {
  const activeOrgans = affectedRegions.flatMap(
    (region) => {
      const regionId = region.bodyRegion.toLowerCase().replace(' ', '_');
      const mappedIds = ORGAN_MAP[regionId] || [regionId]
      return mappedIds.map(id => ({ id, severity: region.confidence }))
    }
  )

  return (
    <div className="w-full h-full min-h-[100vh] relative group bg-[#030712] overflow-hidden">
      <Canvas camera={{ position: [0, 1.0, 3.2], fov: 50 }} className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
        <color attach="background" args={['#030712']} />
        
        {/* Holographic Cinematic Lighting */}
        <ambientLight intensity={0.5} color="#00ffff" />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00ffff" />
        <directionalLight position={[-10, 5, -5]} intensity={2} color="#0044ff" />
        <spotLight position={[0, 10, 0]} intensity={3} angle={0.6} penumbra={1} color="#00ffff" />
        <spotLight position={[0, -10, 0]} intensity={2} angle={0.8} penumbra={1} color="#0088ff" />

        {/* Attempt to load /anatomy.glb, otherwise gracefully fallback to Procedural */}
        <ModelErrorBoundary fallback={
          <ProceduralAnatomyModel 
            activeOrganIds={activeOrgans.map(o => o.id)} 
            opacity={opacity} 
            wireframe={wireframe} 
            activeSystems={activeSystems} 
            affectedRegions={affectedRegions}
          />
        }>
          <Suspense fallback={
            <ProceduralAnatomyModel 
              activeOrganIds={activeOrgans.map(o => o.id)} 
              opacity={opacity} 
              wireframe={wireframe} 
              activeSystems={activeSystems} 
              affectedRegions={affectedRegions}
            />
          }>
             <RealAnatomyModel 
               activeOrgans={activeOrgans} 
               activeSystems={activeSystems}
               affectedRegions={affectedRegions}
             />
          </Suspense>
        </ModelErrorBoundary>

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
          minDistance={1.5}
          maxDistance={7}
          target={[0, 0.8, 0]}
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
            <div className="flex justify-between items-center border-t border-cyan-500/10 pt-1.5 mt-1 text-[9px] text-gray-500">
              <span>METABOLIC INDEX:</span>
              <span>{Math.round(70 + Math.random() * 25)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
