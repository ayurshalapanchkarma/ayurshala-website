'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'

/**
 * InventoryHeader - EXACT 1:1 match to Ayurshala website Navbar
 * 
 * This header reuses the EXACT same:
 * - Glass effect (blur, saturate, contrast, brightness)
 * - Colors and transparency
 * - Border styling and shadows
 * - Logo sizing and proportions
 * - Typography and spacing
 * - Button styling (rounded-full pill style)
 * - Responsive breakpoints
 * - Animation timing
 * 
 * It's a direct copy of Navbar.tsx adapted for Inventory context.
 * CSS utilities from globals.css are reused via .btn-glass and .glass classes.
 * 
 * Key visual elements:
 * - Full-width pill container (rounded-full, ~56-64px height)
 * - Backdrop blur with glass effect
 * - Transparent with subtle olive/green gradient
 * - Thin gold/orange border
 * - Soft shadow (floating effect)
 * - Logo: 56-64px
 * - Typography: Large prominent title + smaller subtitle
 * - Theme toggle: Icon only, rounded-full pill style
 * - Logout: Rounded-full pill with subtle hover glow
 */
export default function InventoryHeader() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!mounted) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 pt-2 sm:pt-6">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full mx-auto rounded-2xl sm:rounded-3xl transition-all duration-300"
        style={{
          // EXACT glass effect from website Navbar
          background: mounted && theme === 'dark'
            ? 'rgba(15,26,18,0.08)'
            : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          border: '1px solid rgba(232,98,26,0.18)',
          boxShadow: '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-3 sm:px-6 md:px-8 flex items-center justify-between h-14 sm:h-16 md:h-20">
          
          {/* Left: Logo + Title Section */}
          <div className="flex items-center h-full py-1 sm:py-2 gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Logo: 56-64px as specified */}
            <div className="flex items-center h-full">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={260}
                height={80}
                className="object-contain h-full w-auto max-w-[56px] sm:max-w-[64px]"
                priority
              />
            </div>

            {/* Title Section - Vertical Stack */}
            <div className="hidden sm:flex flex-col justify-center min-w-0">
              {/* Main Title */}
              <h1 className="text-base md:text-lg font-semibold tracking-wide text-stone-900 dark:text-stone-100 leading-tight whitespace-nowrap">
                Ayurshala Inventory Console
              </h1>
              {/* Subtitle */}
              <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 opacity-75 tracking-wider whitespace-nowrap">
                Inventory • Procurement • Stock Control
              </p>
            </div>
          </div>

          {/* Right: Theme Toggle + Logout Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Theme Toggle - Pill button with icon only */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-glass text-xs py-2 px-3 sm:px-4 flex items-center gap-2 flex-shrink-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Logout Button - Pill style matching website */}
            <button
              onClick={handleLogout}
              className="btn-glass text-xs py-2 px-3 sm:px-4 flex items-center gap-2 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}
