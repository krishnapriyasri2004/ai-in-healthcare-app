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
  skinOpacity: number  // 0.0 – 1.0
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
        // ── REALISTIC WHITE SKIN MATERIAL ──
        const skinMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#F2C9A8'),      // warm light skin tone
          roughness: 0.72,                         // slight matte — real skin
          metalness: 0.0,
          emissive: new THREE.Color('#3A1A0A'),   // deep warm subsurface glow
          emissiveIntensity: 0.08,
          transparent: systems.skinOpacity < 1.0,
          opacity: systems.skinOpacity,
          depthWrite: systems.skinOpacity >= 0.95,
          side: THREE.FrontSide,
        })
        child.material = skinMat
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
    <div className="w-full h-full bg-surface text-on-surface flex flex-col overflow-hidden select-none relative font-body">
      {/* Global Scanline Effect */}
      <div className="scanline"></div>

      

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">

        {/* ── LEFT PANEL: Symptom Input ── */}
        <div className="w-72 bg-surface/40 backdrop-blur-3xl border-r border-primary/20 shadow-2xl flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-surface-variant/50 border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <div>
                <div className="text-sm font-bold text-primary tracking-tight">CLINICAL_OS</div>
                <div className="font-mono text-[9px] text-primary/60">INPUT PARAMETERS</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex justify-between font-label text-xs text-on-surface-variant mb-1.5">
                  <span>AGE</span>
                  <span className="text-primary font-mono">{age}</span>
                </label>
                <input type="range" min="0" max="120" value={age} onChange={e => setAge(parseInt(e.target.value) || 35)}
                  className="w-full accent-primary h-1 bg-surface-variant rounded-full appearance-none" />
              </div>
              <div>
                <label className="font-label text-xs text-on-surface-variant mb-1 block">SEX</label>
                <div className="flex bg-surface-variant rounded p-0.5">
                  <button onClick={() => setSex('Male')} className={`flex-1 py-1 text-[10px] font-mono text-center rounded transition ${sex === 'Male' ? 'bg-primary/20 text-primary shadow-sm border border-primary/30' : 'text-on-surface-variant hover:text-white'}`}>M</button>
                  <button onClick={() => setSex('Female')} className={`flex-1 py-1 text-[10px] font-mono text-center rounded transition ${sex === 'Female' ? 'bg-primary/20 text-primary shadow-sm border border-primary/30' : 'text-on-surface-variant hover:text-white'}`}>F</button>
                </div>
              </div>
            </div>

            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">DURATION</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 days"
                className="w-full bg-surface-variant/50 border border-white/10 rounded py-1.5 px-3 text-xs font-mono text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition" />
            </div>

            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">SEVERITY</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-surface-variant/50 border border-white/10 rounded py-1.5 px-3 text-xs font-mono text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition appearance-none">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="font-label text-xs text-on-surface-variant mb-1 block">SYMPTOMS</label>
              <textarea rows={4} value={symptomsInput} onChange={e => setSymptomsInput(e.target.value)}
                placeholder="Describe patient symptoms..."
                className="w-full bg-surface-variant/50 border border-white/10 rounded py-2 px-3 text-xs font-mono text-primary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition leading-relaxed" />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-3">
            <button onClick={handleAnalyze} disabled={isLoading || !symptomsInput.trim()}
              className="w-full py-2.5 bg-primary/10 border border-primary text-primary font-display font-bold text-xs tracking-wider rounded hud-glow hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2">
              {isLoading ? (
                <><span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> PROCESSING...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">troubleshoot</span> RUN_DIAGNOSTIC</>
              )}
            </button>
            <button onClick={handleClear}
              className="w-full py-1.5 bg-surface border border-white/10 hover:bg-white/5 rounded text-on-surface-variant text-[10px] font-mono tracking-widest transition cursor-pointer">
              RESET_SYSTEM
            </button>
          </div>
        </div>

        {/* ── CENTER: 3D Canvas ── */}
        <div className="flex-1 relative bg-black">
          {/* Grid Background Overlay for Tech Feel */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

          {/* Viewport Overlay Info */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="font-mono text-xs text-primary/70 tracking-widest">SCAN_ID: NX-774-B</div>
            <div className="font-mono text-[10px] text-on-surface-variant">RES: 0.1mm ISO</div>
          </div>

          {/* Layer Controls — Floating Bottom Center */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 glass-panel p-2 rounded-full flex items-center gap-1.5 z-20 shadow-2xl">
            {LAYERS.map(layer => {
               const active = systems[layer.key as keyof SystemToggles] as boolean
               return (
                 <button key={layer.key} onClick={() => toggleSystem(layer.key as keyof SystemToggles)}
                    title={layer.label}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'bg-primary/20 text-primary border border-primary/50 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                        : 'bg-surface-variant text-on-surface-variant hover:text-white border border-transparent'
                    }`}>
                    <span className="text-lg">{layer.icon}</span>
                 </button>
               )
            })}
            
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            {/* Skin Opacity */}
            <div className="flex items-center gap-2 px-2" title="Skin Opacity">
              <span className="text-sm opacity-70">🫁</span>
              <input type="range" min="0" max="1" step="0.01" value={systems.skinOpacity}
                onChange={e => setSystems(prev => ({ ...prev, skinOpacity: parseFloat(e.target.value) }))}
                className="w-24 accent-primary h-1 bg-surface-variant rounded-full appearance-none cursor-pointer" />
            </div>

            <div className="w-px h-6 bg-white/10 mx-2"></div>

            <button onClick={handleSplit} title="Split/Merge Models"
              className={`px-4 h-10 rounded-full border text-xs font-mono font-bold tracking-widest transition-all cursor-pointer ${
                splitRef.current
                  ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                  : 'bg-surface-variant border-transparent text-on-surface-variant hover:text-white'
              }`}>
              {splitRef.current ? 'MERGE' : 'SPLIT'}
            </button>
          </div>

          <Suspense fallback={<LoadingSpinner />}>
            <Canvas
              camera={{ position: [0, 0.2, 4.2], fov: 50 }}
              dpr={[1, 1.5]}
              gl={{ antialias: false, powerPreference: 'high-performance', alpha: true, stencil: false, depth: true }}
              performance={{ min: 0.5 }}
              style={{ position: 'absolute', inset: 0, zIndex: 10 }}
            >
              {/* Optimized lighting */}
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

              <gridHelper args={[8, 20, '#00ffff', '#050505']} position={[0, -0.99, 0]} />

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
        <div className="w-80 glass-panel border-l border-white/5 flex flex-col shrink-0 z-10">
          <div className="p-5 border-b border-white/10 bg-gradient-to-b from-primary/5 to-transparent">
            <h2 className="font-display font-bold text-sm tracking-widest text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">troubleshoot</span>
              NEURAL DIAGNOSIS
            </h2>
          </div>

          <div className="flex-1 p-5 space-y-6 overflow-y-auto">
            {/* Red Flag Status Box */}
            {redFlag && (
              <div className="bg-error/10 border border-error/30 rounded p-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs text-error font-bold tracking-widest">CRITICAL ANOMALY</span>
                  <span className="material-symbols-outlined text-error text-sm animate-pulse">warning</span>
                </div>
                <p className="font-body text-xs text-error/80 leading-relaxed">Immediate clinical review recommended based on neural diagnostic markers.</p>
              </div>
            )}

            {/* Affected Organs */}
            {mappedRegions.length > 0 && (
              <div>
                <h3 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-3 border-b border-white/10 pb-1">Affected Regions</h3>
                <div className="space-y-2">
                  {mappedRegions.map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-surface-variant/50 p-2 rounded border border-white/5">
                      <span className="font-label text-xs text-white capitalize">{r}</span>
                      <span className="px-1.5 py-0.5 bg-error text-white text-[9px] font-mono rounded shadow-[0_0_8px_rgba(255,51,51,0.6)]">HIGH RISK</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions / Confidence Matrix */}
            <div>
              <h3 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mb-3 border-b border-white/10 pb-1">Confidence Matrix</h3>
              {conditions.length > 0 ? (
                <div className="space-y-5">
                  {conditions.map((c, i) => {
                    const color = c.confidence >= 80 ? 'bg-error' : c.confidence >= 50 ? 'bg-secondary' : 'bg-primary/50';
                    const textColor = c.confidence >= 80 ? 'text-error' : c.confidence >= 50 ? 'text-secondary' : 'text-primary/50';
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-label mb-1">
                          <span className="text-white truncate pr-2">{c.name}</span>
                          <span className={`font-mono ${textColor}`}>{c.confidence}%</span>
                        </div>
                        <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${c.confidence}%` }}></div>
                        </div>
                        <p className="text-[9px] text-on-surface-variant/70 leading-relaxed line-clamp-3">{c.reasoning}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="font-mono text-[10px] text-on-surface-variant/50 leading-relaxed">
                    AWAITING INPUT...<br/>RUN DIAGNOSTIC TO GENERATE<br/>CONFIDENCE MATRIX
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-white/10 glass-panel">
            <button className="w-full py-2 bg-surface border border-white/20 text-on-surface-variant hover:text-white text-[10px] font-mono tracking-widest rounded transition-colors flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
              <span className="material-symbols-outlined text-sm">print</span>
              EXPORT REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

