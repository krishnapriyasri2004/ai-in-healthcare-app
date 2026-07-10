'use client'

import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useFBX, Html } from '@react-three/drei'
import * as THREE from 'three'
import Link from 'next/link'
import { Activity, ArrowLeft } from 'lucide-react'

function FBXModel({ path }: { path: string }) {
  const fbx = useFBX(path)
  
  const wrapper = useMemo(() => {
    const clone = fbx.clone()

    // Wrap in parent Group and rotate the wrapper (not the clone)
    // so skinned mesh bone bind poses are not broken
    const wrapper = new THREE.Group()
    wrapper.rotation.x = -Math.PI / 2
    wrapper.add(clone)
    wrapper.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(wrapper)
    const size = box.getSize(new THREE.Vector3())
    const targetHeight = 2.2
    const scaleFactor = targetHeight / (size.y || 1)
    wrapper.scale.setScalar(scaleFactor)
    wrapper.updateMatrixWorld(true)

    const box2 = new THREE.Box3().setFromObject(wrapper)
    const center2 = box2.getCenter(new THREE.Vector3())
    wrapper.position.set(-center2.x, -box2.min.y - 1.1, -center2.z)

    const boneMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8dcc8'),
      roughness: 0.60,
      metalness: 0.05,
      emissive: new THREE.Color('#221e16'),
      emissiveIntensity: 0.15,
    })

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const m = child as THREE.Mesh
      m.castShadow = true
      m.receiveShadow = true
      m.material = boneMaterial.clone()
    })
    
    return wrapper
  }, [fbx])

  return <primitive object={wrapper} />
}

export default function ViewSkeletalPage() {
  return (
    <div className="w-full h-screen bg-surface text-gray-100 flex flex-col font-sans relative overflow-hidden">
      {/* Top Banner/Nav */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <Link 
          href="/scan" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/80 border border-white/10 hover:bg-slate-800 transition font-mono text-xs font-bold text-gray-300 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO SCANNER
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-50 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg font-mono text-xs shadow-lg flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="text-cyan-400 font-bold uppercase">Viewing SkeletalSystem100.fbx</span>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative z-0">
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }} className="w-full h-full">
          <color attach="background" args={['#030712']} />
          
          <ambientLight intensity={0.6} color="#ffffff" />
          <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#38bdf8" />
          <spotLight position={[0, 10, 0]} intensity={2} angle={0.6} penumbra={1} color="#38bdf8" />

          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-4 font-mono text-cyan-400 text-sm">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <div>LOADING SKELETAL FBX MODEL (41MB)...</div>
              </div>
            </Html>
          }>
            <FBXModel path="/ai-in-healthcare/asset-01/SkeletalSystem100.fbx" />
          </Suspense>

          <ContactShadows 
            position={[0, -1.1, 0]} 
            opacity={0.8} 
            scale={5} 
            blur={2.5} 
            far={3.5} 
            color="#0ea5e9"
          />

          <OrbitControls
            enablePan={true}
            minDistance={1.0}
            maxDistance={10}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* Footer Info HUD */}
      <div className="absolute bottom-4 left-4 z-50 bg-slate-950/80 backdrop-blur-md border border-white/10 p-4 rounded-lg font-mono text-[11px] text-gray-400 max-w-sm">
        <div className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Model Information</div>
        <p className="mb-2">File: SkeletalSystem100.fbx</p>
        <p className="mb-2">Location: /public/asset-01/SkeletalSystem100.fbx</p>
        <p>Interact using Left Click to rotate, Right Click to pan, and Scroll to zoom.</p>
      </div>
    </div>
  )
}
