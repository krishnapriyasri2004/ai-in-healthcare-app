'use client'

import { useRef, useEffect, useState } from 'react'

interface DICOMViewerProps {
  patientId: string
  patientName: string
  sliceIndex: number
  onSliceChange: (index: number) => void
  crosshair: { x: number; y: number }
  onCrosshairChange: (pos: { x: number; y: number }) => void
}

export function DICOMViewer({
  patientId,
  patientName,
  sliceIndex,
  onSliceChange,
  crosshair,
  onCrosshairChange
}: DICOMViewerProps) {
  const axialRef = useRef<HTMLCanvasElement>(null)
  const coronalRef = useRef<HTMLCanvasElement>(null)
  const sagittalRef = useRef<HTMLCanvasElement>(null)
  const reconRef = useRef<HTMLCanvasElement>(null)
  
  const [showCrosshairs, setShowCrosshairs] = useState(true)

  // Grayscale rendering logic on Canvas
  useEffect(() => {
    const drawAxial = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      
      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(width, height) * 0.35
      const sIndex = sliceIndex / 100 // 0.0 to 1.0

      if (patientId === 'pat-2') {
        // Brain CT: Skull (white circle) + brain tissue (grey) + ventricles (dark grey) + hemorrhage (orange/red)
        // Outer Skull Ring
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.stroke()

        // Brain Tissue
        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2)
        ctx.fill()

        // Ventricles (dark grey, Butterfly shape)
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        // Left lobe
        ctx.ellipse(cx - 15, cy - 5, 8, 22 * sIndex, 0, 0, Math.PI * 2)
        // Right lobe
        ctx.ellipse(cx + 15, cy - 5, 8, 22 * sIndex, 0, 0, Math.PI * 2)
        ctx.fill()

        // Abnormality: Hemorrhage (high density, bright white/orange, peak at sliceIndex=50)
        const hemIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 50) / 25)
        if (hemIntensity > 0) {
          ctx.fillStyle = '#ef4444'
          ctx.shadowColor = '#f43f5e'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(cx + 25, cy + 20, 12 * hemIntensity, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0 // Reset shadow
          
          ctx.fillStyle = '#ffedd5'
          ctx.beginPath()
          ctx.arc(cx + 23, cy + 18, 5 * hemIntensity, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (patientId === 'pat-1') {
        // Wrist CT: Ivory white wrist bones (Radius, Ulna) + soft tissue outline
        // Soft tissue boundary
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(cx, cy, radius * 1.2, radius * 0.8, 0, 0, Math.PI * 2)
        ctx.stroke()
        
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.ellipse(cx, cy, radius * 1.2 - 2, radius * 0.8 - 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Bones (Radius left, Ulna right)
        ctx.fillStyle = '#f8fafc'
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 2
        
        // Radius bone
        ctx.beginPath()
        ctx.arc(cx - 20, cy, 18 + sIndex * 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Ulna bone
        ctx.beginPath()
        ctx.arc(cx + 25, cy, 12 - sIndex * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Fracture line on Radius (at sliceIndex=55-75)
        if (sliceIndex >= 45 && sliceIndex <= 80) {
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(cx - 36, cy - 8)
          ctx.lineTo(cx - 10, cy + 10)
          ctx.stroke()
        }
      } else {
        // Chest CT (Amit Patel): Ribs (ivory segments) + dark lung fields + central mediastinum (heart/vessels)
        // Dark lung fields
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        // Left Lung
        ctx.ellipse(cx - 35, cy, 32, 45, 0, 0, Math.PI * 2)
        // Right Lung
        ctx.ellipse(cx + 35, cy, 32, 45, 0, 0, Math.PI * 2)
        ctx.fill()

        // Mediastinum (Center chest block)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.ellipse(cx, cy, 15, 30, 0, 0, Math.PI * 2)
        ctx.fill()

        // Ribs (Ivory white dashes around periphery)
        ctx.strokeStyle = '#f8fafc'
        ctx.lineWidth = 4
        ctx.setLineDash([8, 12])
        ctx.beginPath()
        ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([]) // Reset

        // Tubercular Cavitation nodule in Left Lung (peak at sliceIndex=60)
        const tbIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 60) / 20)
        if (tbIntensity > 0) {
          ctx.strokeStyle = '#eab308'
          ctx.lineWidth = 2
          ctx.fillStyle = '#020617'
          ctx.beginPath()
          ctx.arc(cx - 30, cy - 15, 10 * tbIntensity, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Active central inflammation
          ctx.fillStyle = '#eab308'
          ctx.beginPath()
          ctx.arc(cx - 30, cy - 15, 3 * tbIntensity, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawCoronal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      
      const cx = width / 2
      const cy = height / 2
      const sIndex = sliceIndex / 100

      if (patientId === 'pat-2') {
        // Brain Coronal (vertical skull oval)
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.ellipse(cx, cy, 45, 60, 0, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.ellipse(cx, cy, 41, 56, 0, 0, Math.PI * 2)
        ctx.fill()

        // Hemorrhage dot
        const hemIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 50) / 30)
        if (hemIntensity > 0) {
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(cx + 15, cy - 10, 10 * hemIntensity, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (patientId === 'pat-1') {
        // Wrist Coronal (Long shafts of radius/ulna bones entering wrist joints)
        ctx.fillStyle = '#f8fafc'
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5

        // Radius Shaft
        ctx.fillRect(cx - 30, cy - 30, 20, 80)
        // Ulna Shaft
        ctx.fillRect(cx + 10, cy - 25, 12, 80)

        // Fracture line
        if (sliceIndex >= 45 && sliceIndex <= 80) {
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(cx - 32, cy + 10)
          ctx.lineTo(cx - 8, cy + 18)
          ctx.stroke()
        }
      } else {
        // Chest Coronal (Lungs shaped like two lobes with diaphragm dome underneath)
        ctx.fillStyle = '#0f172a'
        // Left Lung Lobe
        ctx.beginPath()
        ctx.ellipse(cx - 32, cy - 10, 25, 48, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Right Lung Lobe
        ctx.beginPath()
        ctx.ellipse(cx + 32, cy - 10, 25, 48, 0, 0, Math.PI * 2)
        ctx.fill()

        // Diaphragm dome at bottom
        ctx.fillStyle = '#1e293b'
        ctx.beginPath()
        ctx.arc(cx, cy + 55, 60, Math.PI, 0)
        ctx.fill()

        // TB Cavitation
        const tbIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 60) / 25)
        if (tbIntensity > 0) {
          ctx.strokeStyle = '#eab308'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(cx - 28, cy - 20, 8 * tbIntensity, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    const drawSagittal = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      
      const cx = width / 2
      const cy = height / 2
      const sIndex = sliceIndex / 100

      if (patientId === 'pat-2') {
        // Sagittal Brain (Profile skull outline with nasal protrusion)
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(cx, cy - 10, 50, Math.PI * 1.1, Math.PI * 1.9)
        ctx.lineTo(cx + 42, cy + 25)
        ctx.lineTo(cx - 25, cy + 35)
        ctx.closePath()
        ctx.stroke()

        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.arc(cx, cy - 10, 46, Math.PI * 1.1, Math.PI * 1.9)
        ctx.lineTo(cx + 38, cy + 21)
        ctx.lineTo(cx - 21, cy + 31)
        ctx.closePath()
        ctx.fill()

        // Hemorrhage dot
        const hemIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 50) / 30)
        if (hemIntensity > 0) {
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(cx + 8, cy - 12, 10 * hemIntensity, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (patientId === 'pat-1') {
        // Wrist Sagittal (Lateral wrist bones stacked)
        ctx.fillStyle = '#f8fafc'
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.roundRect(cx - 15, cy - 35, 24, 75, 8)
        ctx.fill()
        ctx.stroke()

        // Fracture line
        if (sliceIndex >= 45 && sliceIndex <= 80) {
          ctx.strokeStyle = '#ef4444'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(cx - 17, cy + 5)
          ctx.lineTo(cx + 11, cy + 9)
          ctx.stroke()
        }
      } else {
        // Chest Sagittal (Single side-profile lung lobe shape with vertebral column curve on the left)
        // Vertebral column
        ctx.fillStyle = '#334155'
        ctx.fillRect(cx - 45, cy - 50, 12, 100)

        // Lung Lobe
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.ellipse(cx + 5, cy, 32, 48, -0.1, 0, Math.PI * 2)
        ctx.fill()

        // TB Cavitation
        const tbIntensity = Math.max(0, 1 - Math.abs(sliceIndex - 60) / 25)
        if (tbIntensity > 0) {
          ctx.strokeStyle = '#eab308'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(cx + 8, cy - 15, 8 * tbIntensity, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    const drawRecon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      
      const cx = width / 2
      const cy = height / 2

      // Render a high contrast 3D clinical volumetric look
      if (patientId === 'pat-2') {
        // Volumetric Head/Brain (3D look)
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 1
        ctx.fillStyle = '#070f2b'
        
        ctx.beginPath()
        ctx.ellipse(cx, cy, 45, 55, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Overlay glowing brain scans
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'
        ctx.setLineDash([4, 8])
        ctx.beginPath()
        ctx.ellipse(cx, cy, 38, 48, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Glowing red stroke region
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
        ctx.beginPath()
        ctx.arc(cx + 15, cy - 10, 18, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx + 15, cy - 10, 18, 0, Math.PI * 2)
        ctx.stroke()
      } else if (patientId === 'pat-1') {
        // Volumetric skeleton hand/wrist 3D look
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 1
        
        // Hand fingers outline
        ctx.beginPath()
        ctx.moveTo(cx - 30, cy - 50)
        ctx.lineTo(cx - 30, cy - 20)
        ctx.lineTo(cx - 15, cy - 50)
        ctx.lineTo(cx - 15, cy - 20)
        ctx.lineTo(cx, cy - 52)
        ctx.lineTo(cx, cy - 18)
        ctx.lineTo(cx + 15, cy - 48)
        ctx.lineTo(cx + 15, cy - 22)
        ctx.stroke()

        // Carpal stack (grey box)
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(cx - 28, cy - 15, 52, 25)
        ctx.strokeRect(cx - 28, cy - 15, 52, 25)

        // Radius / Ulna shafts
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(cx - 25, cy + 15, 18, 45)
        ctx.strokeRect(cx - 25, cy + 15, 18, 45)

        ctx.fillRect(cx + 5, cy + 15, 12, 45)
        ctx.strokeRect(cx + 5, cy + 15, 12, 45)

        // Highlight fracture zone
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
        ctx.beginPath()
        ctx.arc(cx - 16, cy + 22, 10, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Volumetric Rib cage & lung fields
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 1
        
        // Central Spine column
        ctx.strokeRect(cx - 6, cy - 50, 12, 100)

        // Lungs outline
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.ellipse(cx - 25, cy, 22, 42, 0, 0, Math.PI * 2)
        ctx.ellipse(cx + 25, cy, 22, 42, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Highlight lesion
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)'
        ctx.beginPath()
        ctx.arc(cx - 20, cy - 10, 14, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.strokeStyle = '#eab308'
        ctx.beginPath()
        ctx.arc(cx - 20, cy - 10, 14, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const drawGrid = (canvas: HTMLCanvasElement, renderFunc: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, title: string) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const width = canvas.width
      const height = canvas.height
      
      renderFunc(ctx, width, height)

      // Draw HUD Metadata overlays (clinician window/level metrics)
      ctx.fillStyle = '#0ea5e9'
      ctx.font = 'bold 9px monospace'
      ctx.fillText(title, 8, 16)
      
      ctx.fillStyle = '#64748b'
      ctx.font = '8px monospace'
      ctx.fillText(`Slice: ${sliceIndex}/100`, 8, height - 8)
      ctx.fillText(`ID: ${patientId.toUpperCase()}`, width - 75, 16)
      
      if (title !== '3D RECON') {
        ctx.fillText(`W: 80 L: 40`, width - 68, height - 8)
      } else {
        ctx.fillText(`MIP/VR`, width - 42, height - 8)
      }

      // Draw crosshair overlay (green target lines)
      if (showCrosshairs && title !== '3D RECON') {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.45)'
        ctx.lineWidth = 0.8
        
        // Horizontal crosshair line
        ctx.beginPath()
        ctx.moveTo(0, crosshair.y)
        ctx.lineTo(width, crosshair.y)
        ctx.stroke()

        // Vertical crosshair line
        ctx.beginPath()
        ctx.moveTo(crosshair.x, 0)
        ctx.lineTo(crosshair.x, height)
        ctx.stroke()

        // Center cursor ring
        ctx.strokeStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(crosshair.x, crosshair.y, 4, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    if (axialRef.current) drawGrid(axialRef.current, drawAxial, 'AXIAL CT')
    if (coronalRef.current) drawGrid(coronalRef.current, drawCoronal, 'CORONAL CT')
    if (sagittalRef.current) drawGrid(sagittalRef.current, drawSagittal, 'SAGITTAL CT')
    if (reconRef.current) drawGrid(reconRef.current, drawRecon, '3D RECON')

  }, [patientId, sliceIndex, crosshair, showCrosshairs])

  // Click handler to adjust crosshairs dynamically
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Scale coordinates back to canvas dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    onCrosshairChange({ x: x * scaleX, y: y * scaleY })
  }

  return (
    <div className="w-full bg-[#020617] border border-blue-950/60 rounded-xl p-4 flex flex-col gap-3 shadow-lg select-none">
      
      {/* HUD Header */}
      <div className="flex justify-between items-center border-b border-blue-950/40 pb-2.5 font-mono text-[10px]">
        <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          📁 Synchronized 2D DICOM Planes ({patientName})
        </span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showCrosshairs} 
              onChange={() => setShowCrosshairs(!showCrosshairs)} 
              className="rounded bg-black border-blue-950/50 text-cyan-500 cursor-pointer focus:ring-0"
            />
            <span>Overlay Crosshairs</span>
          </label>
        </div>
      </div>

      {/* Grid of four planes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/40 p-2.5 rounded-lg border border-blue-950/20">
        
        <div className="flex flex-col gap-1 items-center">
          <canvas
            ref={axialRef}
            width={200}
            height={200}
            onClick={(e) => handleCanvasClick(e, axialRef)}
            className="w-full max-w-[150px] aspect-square rounded border border-slate-800 bg-black cursor-crosshair shadow-md hover:border-slate-700 transition"
          />
        </div>

        <div className="flex flex-col gap-1 items-center">
          <canvas
            ref={coronalRef}
            width={200}
            height={200}
            onClick={(e) => handleCanvasClick(e, coronalRef)}
            className="w-full max-w-[150px] aspect-square rounded border border-slate-800 bg-black cursor-crosshair shadow-md hover:border-slate-700 transition"
          />
        </div>

        <div className="flex flex-col gap-1 items-center">
          <canvas
            ref={sagittalRef}
            width={200}
            height={200}
            onClick={(e) => handleCanvasClick(e, sagittalRef)}
            className="w-full max-w-[150px] aspect-square rounded border border-slate-800 bg-black cursor-crosshair shadow-md hover:border-slate-700 transition"
          />
        </div>

        <div className="flex flex-col gap-1 items-center">
          <canvas
            ref={reconRef}
            width={200}
            height={200}
            className="w-full max-w-[150px] aspect-square rounded border border-slate-800 bg-black shadow-md"
          />
        </div>

      </div>

      {/* Slice manual scrolling slider control */}
      <div className="flex items-center gap-4 mt-1 font-mono text-[9px] text-slate-500">
        <span className="uppercase font-bold shrink-0 text-slate-400">Manual DICOM Slice scroll:</span>
        <input 
          type="range"
          min={0}
          max={100}
          value={sliceIndex}
          onChange={(e) => onSliceChange(parseInt(e.target.value))}
          className="flex-1 accent-cyan-500 h-1 bg-blue-950/60 rounded-lg cursor-pointer appearance-none"
        />
        <span className="shrink-0 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-300 font-bold">
          Im: {sliceIndex} / 100
        </span>
      </div>

    </div>
  )
}
