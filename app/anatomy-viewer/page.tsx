'use client'

import React, { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
interface SystemToggles {
  skeletal: boolean
  muscular: boolean
  organs: boolean
  vessels: boolean
  skin: boolean
}

type ViewMode = 'merged' | 'split'

// ═══════════════════════════════════════════════════════
// FAST GLB MODEL — Zero-jank, cached visibility, instant split
// ═══════════════════════════════════════════════════════
function FastGLBModel({ path, column, systems, onSplit, splitRef }: {
  path: string
  column: number // -2, -1, 0, 1, 2 (position multiplier)
  systems: SystemToggles
  onSplit: () => void
  splitRef: React.MutableRefObject<boolean>
}) {
  const { scene } = useGLTF(path)
  const groupRef = useRef<THREE.Group>(null)

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)

    // Apply model-specific root rotations
    if (path.includes('myology') || path.includes('scene')) {
      const sk = clone.getObjectByName('Sketchfab_model')
      if (sk) sk.rotation.set(-Math.PI / 2, 0, 0)
      else clone.rotation.x = -Math.PI / 2
    }
    if (path.includes('splanchnology') && column === -2) {
      const sk = clone.getObjectByName('Sketchfab_model')
      if (sk) sk.rotation.set(0, 0, 0)
    }

    // Compute bounding box from ALL meshes FIRST (before any removal)
    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const n = child.name.toLowerCase()
        if (n.includes('floor') || n.includes('ground') || n.includes('plane')) return
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
        const mb = child.geometry.boundingBox!.clone().applyMatrix4(child.matrixWorld)
        if (!hasMesh) { box.copy(mb); hasMesh = true } else box.union(mb)
      }
    })
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = 2.0 / (size.y || 1)
    clone.scale.setScalar(scale)
    clone.position.set(0, -box.min.y * scale - 1.0, -center.z * scale)

    // NOW remove unwanted meshes per column
    if (path.includes('splanchnology')) {
      const toRemove: THREE.Object3D[] = []
      if (column === -1) {
        // Organs column: remove skin, bones, skull
        clone.traverse((c) => {
          const n = c.name.toLowerCase()
          if (n.includes('skin') || n.includes('bone') || n.includes('skull')) toRemove.push(c)
        })
      } else if (column === -2) {
        // Skin column: remove everything except skin
        clone.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            const n = c.name.toLowerCase()
            const isSkin = n.includes('skin') || n.includes('integumentary') || n.includes('body') || n.includes('short') || n.includes('eye') || n.includes('head') || n.includes('lash') || n.includes('nail') || n.includes('hair')
            if (!isSkin) toRemove.push(c)
          }
        })
      }
      toRemove.forEach(c => { if (c.parent) c.parent.remove(c) })
    }

    // Disable shadows, set opaque materials
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false
        child.receiveShadow = false
        child.frustumCulled = true
      }
    })

    return clone
  }, [scene, column, path])

  // INSTANT horizontal slide — fast lerp 0.4
  useFrame(() => {
    if (!groupRef.current) return
    const targetX = splitRef.current ? column * 1.2 : 0.0
    const dx = Math.abs(groupRef.current.position.x - targetX)
    if (dx > 0.002) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.4)
    } else {
      groupRef.current.position.x = targetX
    }
  })

  // Visibility based on system toggles
  useEffect(() => {
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const n = child.name.toLowerCase()

      if (path.includes('splanchnology') && column === -2) {
        child.visible = systems.skin
        // Semi-transparent skin
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((m: any) => {
          if (m) { m.transparent = true; m.opacity = 0.2; m.depthWrite = false }
        })
        return
      }

      if (path.includes('splanchnology') && column === -1) {
        child.visible = systems.organs
        return
      }

      if (path.includes('scene')) {
        child.visible = systems.vessels
        return
      }

      if (path.includes('myology')) {
        child.visible = systems.muscular
        return
      }

      child.visible = true
    })
  }, [cloned, systems, path, column])

  // Determine overall visibility
  let visible = true
  if (path.includes('splanchnology') && column === -2) visible = systems.skin
  if (path.includes('splanchnology') && column === -1) visible = systems.organs
  if (path.includes('scene')) visible = systems.vessels
  if (path.includes('myology')) visible = systems.muscular

  if (!visible) return null

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onSplit() }}>
      <primitive object={cloned} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════
// FAST FBX MODEL — Skeleton
// ═══════════════════════════════════════════════════════
function FastFBXModel({ path, column, systems, onSplit, splitRef }: {
  path: string
  column: number
  systems: SystemToggles
  onSplit: () => void
  splitRef: React.MutableRefObject<boolean>
}) {
  const fbx = useFBX(path)
  const groupRef = useRef<THREE.Group>(null)

  const cloned = useMemo(() => {
    const clone = SkeletonUtils.clone(fbx)
    clone.rotation.x = -Math.PI / 2

    clone.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    let hasMesh = false
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
        const mb = child.geometry.boundingBox!.clone().applyMatrix4(child.matrixWorld)
        if (!hasMesh) { box.copy(mb); hasMesh = true } else box.union(mb)
      }
    })
    if (!hasMesh) box.setFromObject(clone)

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = 2.0 / (size.y || 1)
    clone.scale.setScalar(scale)
    clone.position.set(0, -box.min.y * scale - 1.0, -center.z * scale)

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false
        child.receiveShadow = false
        child.frustumCulled = true
        const mesh = child as any
        if (!mesh.isSkinnedMesh && mesh.geometry) {
          if (mesh.geometry.attributes.skinIndex) mesh.geometry.deleteAttribute('skinIndex')
          if (mesh.geometry.attributes.skinWeight) mesh.geometry.deleteAttribute('skinWeight')
        }
      }
    })

    return clone
  }, [fbx, column])

  useFrame(() => {
    if (!groupRef.current) return
    const targetX = splitRef.current ? column * 1.2 : 0.0
    const dx = Math.abs(groupRef.current.position.x - targetX)
    if (dx > 0.002) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.4)
    } else {
      groupRef.current.position.x = targetX
    }
  })

  useEffect(() => {
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) child.visible = systems.skeletal
    })
  }, [cloned, systems.skeletal])

  if (!systems.skeletal) return null

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onSplit() }}>
      <primitive object={cloned} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════
// LOADING SPINNER
// ═══════════════════════════════════════════════════════
function LoadingSpinner() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#060a14]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-cyan-400 text-sm font-medium tracking-wider animate-pulse">Loading 3D Models...</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function AnatomyViewerPage() {
  const splitRef = useRef(false)
  const [, forceUpdate] = useState(0)

  const [systems, setSystems] = useState<SystemToggles>({
    skeletal: true,
    muscular: true,
    organs: true,
    vessels: true,
    skin: false,
  })

  // Symptom analysis state
  const [symptomsInput, setSymptomsInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conditions, setConditions] = useState<{name: string; confidence: number; reasoning: string}[]>([])
  const [redFlag, setRedFlag] = useState(false)
  const [age, setAge] = useState(35)
  const [sex, setSex] = useState<'Male' | 'Female'>('Male')
  const [duration, setDuration] = useState('3 days')
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium')
  const [mappedRegions, setMappedRegions] = useState<string[]>([])

  const handleSplit = useCallback(() => {
    splitRef.current = !splitRef.current
    forceUpdate(n => n + 1) // update status text only
  }, [])

  const toggleSystem = (key: keyof SystemToggles) => {
    setSystems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAnalyze = async () => {
    if (!symptomsInput.trim()) return
    setIsLoading(true)
    setConditions([])
    setRedFlag(false)
    setMappedRegions([])

    try {
      const response = await fetch('/ai-in-healthcare/api/analyze-symptoms-viewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, sex, duration, severity, symptoms: symptomsInput })
      })
      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setConditions(data.possibleConditions || [])
      setRedFlag(!!data.redFlag)
      setMappedRegions(data.affectedRegions || [])

      // Auto-split on analysis
      splitRef.current = true
      forceUpdate(n => n + 1)
    } catch (e: any) {
      console.error(e)
      setConditions([{ name: 'Analysis Error', confidence: 0, reasoning: e.message || 'Failed to connect' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setSymptomsInput('')
    setConditions([])
    setRedFlag(false)
    setMappedRegions([])
    splitRef.current = false
    forceUpdate(n => n + 1)
  }

  const LAYERS: { label: string; key: keyof SystemToggles; icon: string; color: string }[] = [
    { label: 'Skeleton', key: 'skeletal', icon: '🦴', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400' },
    { label: 'Muscles', key: 'muscular', icon: '💪', color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400' },
    { label: 'Organs', key: 'organs', icon: '🫀', color: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400' },
    { label: 'Vessels', key: 'vessels', icon: '🩸', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400' },
    { label: 'Skin', key: 'skin', icon: '🧬', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400' },
  ]

  return (
    <div className="w-full h-screen bg-[#060a14] text-white flex flex-col overflow-hidden select-none">

      {/* ═══ HEADER ═══ */}
      <header className="h-14 bg-[#0a0f1e]/95 backdrop-blur border-b border-white/[0.06] px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/scan" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition text-xs text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <div className="h-5 w-px bg-white/10"></div>
          <div>
            <h1 className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
              3D Anatomy Viewer
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">Click model to split · Scroll to zoom · Drag to rotate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${
            splitRef.current 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-white/[0.03] border-white/[0.08] text-gray-500'
          }`}>
            {splitRef.current ? '◉ Split Active' : '○ Merged'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
            ● Live
          </span>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Symptom Input ── */}
        <div className="w-72 bg-[#0a0f1e]/80 border-r border-white/[0.04] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/[0.04]">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Patient Symptoms
            </h2>
          </div>
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Age</label>
                <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 35)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-1">Sex</label>
                <select value={sex} onChange={e => setSex(e.target.value as any)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-medium block mb-1">Duration</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 days"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition" />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-medium block mb-1">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 font-medium block mb-1">Symptoms</label>
              <textarea rows={5} value={symptomsInput} onChange={e => setSymptomsInput(e.target.value)}
                placeholder="Describe patient symptoms..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 resize-none transition leading-relaxed" />
            </div>
          </div>

          <div className="p-4 border-t border-white/[0.04] space-y-2">
            <button onClick={handleAnalyze} disabled={isLoading || !symptomsInput.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
              {isLoading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Analyzing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Analyze &amp; Map</>
              )}
            </button>
            <button onClick={handleClear}
              className="w-full py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-gray-400 text-xs font-medium transition cursor-pointer">
              Clear All
            </button>
          </div>
        </div>

        {/* ── CENTER: 3D Canvas ── */}
        <div className="flex-1 relative">
          
          {/* Layer Controls — Floating */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
            {LAYERS.map(layer => {
              const active = systems[layer.key]
              return (
                <button key={layer.key} onClick={() => toggleSystem(layer.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer backdrop-blur-sm ${
                    active 
                      ? `bg-gradient-to-r ${layer.color} shadow-lg` 
                      : 'bg-black/40 border-white/[0.06] text-gray-500 hover:text-gray-400 hover:border-white/[0.1]'
                  }`}>
                  <span className="text-sm">{layer.icon}</span>
                  {layer.label}
                </button>
              )
            })}
          </div>

          {/* Split/Merge indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button onClick={handleSplit}
              className={`px-5 py-2 rounded-full border text-xs font-medium transition-all cursor-pointer backdrop-blur-sm ${
                splitRef.current
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.06]'
              }`}>
              {splitRef.current ? '⊟ Click to Merge' : '⊞ Click to Split'}
            </button>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <Canvas
              camera={{ position: [0, 0.2, 4.2], fov: 50 }}
              dpr={[1, 1.5]}
              gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true }}
              performance={{ min: 0.5 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <color attach="background" args={['#060a14']} />

              {/* Optimized lighting — 3 lights only */}
              <ambientLight intensity={0.8} />
              <directionalLight position={[8, 12, 5]} intensity={2.2} />
              <directionalLight position={[-6, 8, -4]} intensity={1.0} color="#e0e8ff" />

              <Suspense fallback={null}>
                {/* Skin (column -2) */}
                <FastGLBModel path="/ai-in-healthcare/asset-01/splanchnology.glb" column={-2} systems={systems} onSplit={handleSplit} splitRef={splitRef} />
                {/* Organs (column -1) */}
                <FastGLBModel path="/ai-in-healthcare/asset-01/splanchnology.glb" column={-1} systems={systems} onSplit={handleSplit} splitRef={splitRef} />
                {/* Skeleton (column 0) */}
                <FastFBXModel path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" column={0} systems={systems} onSplit={handleSplit} splitRef={splitRef} />
                {/* Vessels (column 1) */}
                <FastGLBModel path="/ai-in-healthcare/asset-01/scene.gltf" column={1} systems={systems} onSplit={handleSplit} splitRef={splitRef} />
                {/* Muscles (column 2) */}
                <FastGLBModel path="/ai-in-healthcare/asset-01/myology.glb" column={2} systems={systems} onSplit={handleSplit} splitRef={splitRef} />
              </Suspense>

              <gridHelper args={[8, 20, '#111827', '#0a0f1e']} position={[0, -0.99, 0]} />

              <OrbitControls
                enablePan={true}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.3}
                minDistance={1.0}
                maxDistance={8}
                target={[0, 0, 0]}
              />
            </Canvas>
          </Suspense>
        </div>

        {/* ── RIGHT PANEL: AI Diagnosis ── */}
        <div className="w-72 bg-[#0a0f1e]/80 border-l border-white/[0.04] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/[0.04]">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              AI Diagnosis
            </h2>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {/* Red Flag */}
            {redFlag && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium flex items-start gap-2 animate-pulse">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                ⚠️ Critical findings — immediate clinical review required
              </div>
            )}

            {/* Mapped Regions */}
            {mappedRegions.length > 0 && (
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">Affected Regions</p>
                <div className="flex flex-wrap gap-1.5">
                  {mappedRegions.map((r, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-medium capitalize">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {conditions.length > 0 ? (
              conditions.map((c, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2 hover:border-white/[0.1] transition">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-semibold text-white leading-tight">{c.name}</span>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      c.confidence >= 80 ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                      : c.confidence >= 50 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                    }`}>
                      {c.confidence}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{c.reasoning}</p>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-gray-600 text-xs text-center leading-relaxed">
                  Enter patient symptoms and click<br /><strong className="text-gray-500">Analyze &amp; Map</strong> to generate<br />AI-powered differential diagnosis.
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-3 border-t border-white/[0.04]">
            <p className="text-[9px] text-gray-600 leading-relaxed text-center">
              AI-assisted decision support — not a clinical diagnosis. Requires physician verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
