'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

/**
 * InventoryHeader - Pixel-perfect match to Ayurshala website header
 * 
 * Features:
 * - Identical glassmorphism to website (blur, saturate, contrast, brightness)
 * - Exact same color palette (warm gold/orange, transparency)
 * - Same border styling and shadow effects
 * - Ayurshala logo matching website
 * - "Ayurshala Admin Console" branded title
 * - Theme toggle matching website style
 * - Light & Dark mode support
 * - Responsive design (mobile, tablet, desktop)
 * - Smooth fade + slide-down animation
 * - Sticky positioning
 */
export default function InventoryHeader() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage, matching website's approach
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('inventory-theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    } else {
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('inventory-theme', newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = () => {
    router.push('/admin/login')
    toast.success('Logged out successfully')
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
          // Exact same glassmorphism as website
          background: theme === 'dark'
            ? 'rgba(15,26,18,0.08)'
            : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          border: '1px solid rgba(232,98,26,0.18)',
          boxShadow: '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-3 sm:px-6 md:px-8 flex items-center justify-between h-14 sm:h-16 md:h-20">
          
          {/* Left Section: Logo + Title */}
          <div className="flex items-center h-full py-1 sm:py-2 gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Ayurshala Logo - Same as website */}
            <div className="flex items-center h-full">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={260}
                height={80}
                className="object-contain h-full w-auto max-w-[120px] sm:max-w-[180px]"
                priority
              />
            </div>

            {/* Title */}
            <span className="hidden sm:inline text-sm sm:text-base tracking-wider text-stone-900 dark:text-stone-100 font-semibold whitespace-nowrap">
              Admin Console
            </span>
          </div>

          {/* Right Section: Theme Toggle + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Theme Toggle Button - Glass style matching website */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
              className="btn-glass text-xs py-2 px-4 flex items-center gap-2 transition-all duration-200"
              style={{
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(232, 98, 26, 0.10)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(232, 98, 26, 0.20)',
              }}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-orange-600" />
              )}
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Logout Button - Glass style */}
            <button
              onClick={handleLogout}
              className="btn-glass text-xs py-2 px-4 flex items-center gap-2 transition-all duration-200"
              style={{
                color: theme === 'dark' ? '#fbbf24' : '#ea580c',
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(232, 98, 26, 0.10)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(232, 98, 26, 0.30)',
              }}
              aria-label="Logout"
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
