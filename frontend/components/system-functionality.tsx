'use client'

import React, { useState } from 'react'
import { BookOpen, Layers, Eye, HelpCircle } from 'lucide-react'

interface SystemInfo {
  name: string
  key: string
  icon: string
  function: string
  role: string
  organs: string[]
}

interface OrganInfo {
  name: string
  id: string
  system: string
  function: string
  role: string
}

const SYSTEMS: SystemInfo[] = [
  {
    name: 'Cardiovascular System',
    key: 'cardiovascular',
    icon: '❤️',
    function: 'Circulates oxygen, nutrients, and hormones to tissues; removes carbon dioxide and cellular metabolic waste.',
    role: 'The heart acts as a central pump. Arteries carry oxygen-rich blood away from the heart to arterioles and capillaries, where nutrient exchange occurs. Veins return deoxygenated blood back to the heart and lungs.',
    organs: ['heart', 'arteries', 'veins']
  },
  {
    name: 'Respiratory System',
    key: 'respiratory',
    icon: '🫁',
    function: 'Facilitates gas exchange, introducing oxygen into the bloodstream and expelling carbon dioxide.',
    role: 'Air is inhaled through the nasal cavity and travels down the throat and trachea into the lungs. The bronchi branch into tiny alveoli where oxygen diffuses into the capillaries and carbon dioxide is collected for exhalation.',
    organs: ['lung_left', 'lung_right', 'trachea', 'throat', 'nasal_cavity']
  },
  {
    name: 'Digestive System',
    key: 'digestive',
    icon: '🥩',
    function: 'Breaks down foodstuffs, absorbs vital nutrients into the blood, and eliminates solid wastes.',
    role: 'Food is digested mechanically and chemically in the stomach. The small intestine digests food and absorbs 90% of the nutrients. The liver produces bile to digest lipids and filters toxins, while the large intestine absorbs water.',
    organs: ['stomach', 'liver', 'intestines']
  },
  {
    name: 'Nervous System',
    key: 'nervous',
    icon: '🧠',
    function: 'Processes sensory input, regulates internal systems, and coordinates somatic motor actions.',
    role: 'The brain serves as the central control center, processing sensory information and directing somatic actions. Nerves act as information conduits, transmitting electrical impulses rapidly between the brain and body tissues.',
    organs: ['brain', 'nerves']
  },
  {
    name: 'Skeletal System',
    key: 'skeletal',
    icon: '💀',
    function: 'Provides structural support, protects organs, produces blood cells, and enables movement via joints.',
    role: 'Bones act as a rigid framework. The skull protects the brain, the ribcage shields the lungs and heart, and the spine houses the spinal cord. Joints act as pivots, allowing skeletal muscles to execute motor motion.',
    organs: ['skeletal_bones', 'skeletal_skull', 'skeletal_ribcage']
  },
  {
    name: 'Muscular System',
    key: 'muscular',
    icon: '💪',
    function: 'Generates somatic force and movement, maintains skeletal posture, and produces body heat.',
    role: 'Skeletal muscles attach to bones via tendons. When muscles contract, they pull on bones to produce movement. Ligaments connect bone to bone at joints to maintain skeletal stability and prevent dislocation.',
    organs: ['muscular_muscles']
  },
  {
    name: 'Integumentary System',
    key: 'integumentary',
    icon: '🛡️',
    function: 'Forms a protective external barrier, regulates body temperature, and houses sensory touch receptors.',
    role: 'The skin prevents dehydration, infection, and mechanical injury. Capillaries in the skin dilate or constrict to regulate body temperature, and sweat glands expel moisture to cool the body down.',
    organs: ['skin']
  },
  {
    name: 'Urinary System',
    key: 'urinary',
    icon: '💧',
    function: 'Filters waste products from the blood, regulates electrolyte and fluid balance, and stores urine.',
    role: 'The kidneys filter blood to remove urea, excess salts, and water, producing urine. Urine passes through the ureters into the bladder, which stores it until it is eliminated through the urethra.',
    organs: ['kidney_left', 'kidney_right', 'bladder']
  }
]

const ORGANS: OrganInfo[] = [
  {
    name: 'Brain',
    id: 'brain',
    system: 'Nervous System',
    function: 'Coordinates all physiological functions, sensory processing, cognition, and motor outputs.',
    role: 'Consists of the cerebrum, cerebellum, and brainstem. It contains billions of neurons that transmit chemical and electrical signals to regulate everything from heart rate to voluntary skeletal movement.'
  },
  {
    name: 'Heart',
    id: 'heart',
    system: 'Cardiovascular System',
    function: 'Pumps blood continuously through the vascular network to deliver oxygen and nutrients.',
    role: 'A four-chambered muscular pump. The right atrium and ventricle receive deoxygenated blood and pump it to the lungs; the left atrium and ventricle receive oxygenated blood and pump it to systemic circulation.'
  },
  {
    name: 'Lungs',
    id: 'lungs',
    system: 'Respiratory System',
    function: 'Perform oxygenation of blood and removal of gaseous carbon dioxide wastes.',
    role: 'Twin spongy organs filled with bronchioles that end in millions of tiny air sacs called alveoli. Here, gas exchange occurs across a thin alveolar-capillary membrane via passive diffusion.'
  },
  {
    name: 'Liver',
    id: 'liver',
    system: 'Digestive System',
    function: 'Metabolizes nutrients, detoxifies blood, produces bile, and stores glycogen.',
    role: 'The largest internal gland. It processes nutrients absorbed by the small intestine, produces clotting factors, synthesizes cholesterol, and secretes bile into the gall bladder for lipid emulsification.'
  },
  {
    name: 'Stomach',
    id: 'stomach',
    system: 'Digestive System',
    function: 'Accumulates food, begins protein digestion, and churns food into chyme.',
    role: 'A muscular J-shaped sac that secretes hydrochloric acid (HCl) and pepsin. The stomach physically churns food into a liquid mixture (chyme) before sending it to the duodenum.'
  },
  {
    name: 'Intestines',
    id: 'intestines',
    system: 'Digestive System',
    function: 'Conclude digestion, absorb water and nutrients, and compact solid wastes.',
    role: 'Comprises the small intestine (duodenum, jejunum, ileum) which absorbs nutrients through villi, and the large intestine (colon) which absorbs remaining water, hosts gut microbiome, and stores fecal wastes.'
  },
  {
    name: 'Kidneys',
    id: 'kidneys',
    system: 'Urinary System',
    function: 'Filter metabolic wastes from blood plasma, maintain water/salt balance, and regulate pH.',
    role: 'Contain millions of functional filtering units called nephrons. They filter blood under high pressure, reabsorb essential ions, and excrete urea, creatinine, and water as urine.'
  }
]

interface SystemFunctionalityProps {
  onIsolateSystem: (systemKey: string) => void
  onResetSystems: () => void
  onHighlightOrgan: (organId: string | null) => void
  highlightedOrgan: string | null
  activeSystems: Record<string, boolean>
}

export function SystemFunctionality({
  onIsolateSystem,
  onResetSystems,
  onHighlightOrgan,
  highlightedOrgan,
  activeSystems
}: SystemFunctionalityProps) {
  const [activeTab, setActiveTab] = useState<'systems' | 'organs'>('systems')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const toggleExpand = (key: string) => {
    setExpandedItem(prev => (prev === key ? null : key))
  }

  return (
    <div className="flex flex-col gap-4 p-4 text-xs font-mono text-gray-300">
      {/* Selector Tabs */}
      <div className="flex border-b border-cyan-500/20 pb-2 mb-2 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('systems')
              setExpandedItem(null)
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors font-bold ${
              activeTab === 'systems' ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            SYSTEMS
          </button>
          <button
            onClick={() => {
              setActiveTab('organs')
              setExpandedItem(null)
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors font-bold ${
              activeTab === 'organs' ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            ORGANS
          </button>
        </div>

        {activeTab === 'systems' && (
          <button
            onClick={onResetSystems}
            className="text-[10px] text-cyan-500 hover:text-cyan-400 hover:underline flex items-center gap-1 font-bold"
          >
            RESETS ALL
          </button>
        )}
      </div>

      {/* Content List */}
      <div className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'systems' ? (
          SYSTEMS.map((system) => {
            const isExpanded = expandedItem === system.key
            const isIsolated =
              activeSystems[system.key] &&
              Object.entries(activeSystems).every(([k, v]) => k === system.key || !v)

            return (
              <div
                key={system.key}
                className={`border rounded-lg transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-blue-950/40 bg-black/40 hover:bg-black/60'
                }`}
              >
                <div
                  onClick={() => toggleExpand(system.key)}
                  className="flex items-center justify-between p-3 cursor-pointer select-none"
                >
                  <span className="font-bold text-white flex items-center gap-2 text-[11px]">
                    <span className="text-base">{system.icon}</span>
                    {system.name}
                  </span>
                  <span className="text-[10px] text-cyan-600 font-bold">
                    {isExpanded ? '[-]' : '[+]'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-cyan-950/40 flex flex-col gap-2 text-gray-400 leading-relaxed text-[11px] bg-black/20">
                    <p>
                      <strong className="text-cyan-500 uppercase tracking-wide text-[9px] block mb-0.5">Primary Function:</strong>
                      {system.function}
                    </p>
                    <p className="mt-1">
                      <strong className="text-cyan-500 uppercase tracking-wide text-[9px] block mb-0.5">Physiological Role:</strong>
                      {system.role}
                    </p>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-cyan-950/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onIsolateSystem(system.key)
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold transition-all ${
                          isIsolated
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-400'
                            : 'bg-black/40 border-cyan-500/20 hover:border-cyan-500/50 text-cyan-500 hover:text-cyan-400'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {isIsolated ? 'ISOLATED' : 'ISOLATE SYSTEM'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          ORGANS.map((organ) => {
            const isExpanded = expandedItem === organ.id
            const isHighlighted = highlightedOrgan === organ.id

            return (
              <div
                key={organ.id}
                className={`border rounded-lg transition-all duration-300 overflow-hidden ${
                  isExpanded ? 'border-cyan-500/40 bg-cyan-950/10' : 'border-blue-950/40 bg-black/40 hover:bg-black/60'
                }`}
              >
                <div
                  onClick={() => toggleExpand(organ.id)}
                  className="flex items-center justify-between p-3 cursor-pointer select-none"
                >
                  <span className="font-bold text-white flex flex-col gap-0.5">
                    <span className="text-[11px]">{organ.name}</span>
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-wider">
                      {organ.system}
                    </span>
                  </span>
                  <span className="text-[10px] text-cyan-600 font-bold">
                    {isExpanded ? '[-]' : '[+]'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="p-3 border-t border-cyan-950/40 flex flex-col gap-2 text-gray-400 leading-relaxed text-[11px] bg-black/20">
                    <p>
                      <strong className="text-cyan-500 uppercase tracking-wide text-[9px] block mb-0.5">Primary Function:</strong>
                      {organ.function}
                    </p>
                    <p className="mt-1">
                      <strong className="text-cyan-500 uppercase tracking-wide text-[9px] block mb-0.5">Structure & Role:</strong>
                      {organ.role}
                    </p>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-cyan-950/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onHighlightOrgan(isHighlighted ? null : organ.id)
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded border text-[9px] font-bold transition-all ${
                          isHighlighted
                            ? 'bg-red-950/50 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                            : 'bg-black/40 border-cyan-500/20 hover:border-cyan-500/50 text-cyan-500 hover:text-cyan-400'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {isHighlighted ? 'LOCKED FOCUS' : 'HIGHLIGHT IN 3D'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
