'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layers, Users, FileText, Settings, Home } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '3D Scan Hub', icon: Layers },
    { href: '/patients', label: 'Patient Directory', icon: Users },
    { href: '/analytics', label: 'Clinical Stats', icon: FileText },
    { href: '/settings', label: 'System Config', icon: Settings },
  ]

  return (
    <div className="w-16 bg-[#070f2b]/60 backdrop-blur-xl border-r border-blue-950/50 flex flex-col items-center py-6 gap-6 z-20 shadow-[5px_0_20px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`p-3 rounded-xl transition-all duration-300 relative group flex items-center justify-center ${
              isActive 
                ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-110' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
            }`}
            title={item.label}
          >
            <Icon className="w-5 h-5" />
            
            {/* Hover Tooltip */}
            <div className="absolute left-20 px-2.5 py-1 rounded bg-black/90 border border-blue-900/50 text-[10px] text-gray-300 font-mono uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-md">
              {item.label}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
