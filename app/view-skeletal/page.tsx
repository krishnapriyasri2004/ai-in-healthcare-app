'use client'

import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useFBX, Html } from '@react-three/drei'
import * as THREE from 'three'
import Link from 'next/link'
import { Activity, ArrowLeft } from 'lucide-react'

function FBXModel({ path }: { path: string }) {
  const fbx = useFBX(path)
  
  const cloned = useMemo(() => {
    const clone = fbx.clone()
    
    // Rebind skeleton for SkinnedMesh objects to prevent vertex stretching to original bone coordinates
    const clonedBonesMap = new Map<string, THREE.Bone>()
    clone.traverse((node: any) => {
      if (node.isBone) {
        clonedBonesMap.set(node.name, node)
      }
    })
    
    clone.traverse((node: any) => {
      if (node.isSkinnedMesh) {
        const skeleton = node.skeleton
        const newBones = skeleton.bones.map((bone: any) => {
          return clonedBonesMap.get(bone.name) || bone
        })
        node.bind(new THREE.Skeleton(newBones, skeleton.boneInverses), node.matrixWorld)
      }
    })

    // Compute world matrices for correct hierarchy transformations
    clone.updateWorldMatrix(true, true)
    
    // Ignore background/floor helper nodes to prevent giant bounding boxes
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
    const targetHeight = 2.2
    const scaleFactor = targetHeight / (size.y || 1)
    
    clone.scale.setScalar(scaleFactor)
    clone.position.set(
      -center.x * scaleFactor,
      -box.min.y * scaleFactor - 1.1,
      -center.z * scaleFactor
    )

    clone.traverse((child) => {
      const mesh = child as any
      if (child instanceof THREE.Mesh || mesh.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Remove skinning attributes from non-skinned meshes to prevent shader collapse stretching
        if (!mesh.isSkinnedMesh && mesh.geometry) {
          if (mesh.geometry.attributes.skinIndex) mesh.geometry.deleteAttribute('skinIndex')
          if (mesh.geometry.attributes.skinWeight) mesh.geometry.deleteAttribute('skinWeight')
        }
      }
    })
    
    return clone
  }, [fbx])

  return <primitive object={cloned} />
}

export default function ViewSkeletalPage() {
  return (
    <div className="w-full h-screen bg-[#030712] text-gray-100 flex flex-col font-sans relative overflow-hidden">
      {/* Top Banner/Nav */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        <Link 
          href="/scan" 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/80 border border-blue-950/50 hover:bg-slate-800 transition font-mono text-xs font-bold text-gray-300 backdrop-blur-md"
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
      <div className="absolute bottom-4 left-4 z-50 bg-slate-950/80 backdrop-blur-md border border-blue-950/50 p-4 rounded-lg font-mono text-[11px] text-gray-400 max-w-sm">
        <div className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Model Information</div>
        <p className="mb-2">File: SkeletalSystem100.fbx</p>
        <p className="mb-2">Location: /public/asset-01/SkeletalSystem100.fbx</p>
        <p>Interact using Left Click to rotate, Right Click to pan, and Scroll to zoom.</p>
      </div>
    </div>
  )
}
