'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

/**
 * InventoryHeader - Premium glassmorphic header matching Ayurshala website
 * 
 * Features:
 * - Floating glass panel with warm Ayurvedic gold/orange theme
 * - Ayurshala logo (44-48px)
 * - "Ayurshala Admin Console" title
 * - Theme toggle (glass icon button)
 * - Logout (outlined pill button)
 * - Date display
 * - Smooth fade + slide-down animation on load
 * - Sticky positioning
 * - Light & Dark mode support
 * - Premium, minimal, elegant design matching website branding
 */
export default function InventoryHeader() {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage
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

  // Get current date for display
  const getFormattedDate = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (!mounted) return null

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 px-5 mt-4 mb-5"
    >
      <div
        className="rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300"
        style={{
          background: theme === 'dark'
            ? 'rgba(15, 26, 18, 0.08)'
            : 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          border: '1px solid rgba(232, 98, 26, 0.18)',
          boxShadow: '0 8px 32px rgba(232, 98, 26, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          
          {/* Left Section: Logo + Title */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={260}
                height={80}
                priority
                className="h-8 sm:h-10 w-auto"
              />
            </div>

            {/* Title */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-900 dark:text-white leading-tight whitespace-nowrap">
                Admin Console
              </h1>
            </div>
          </div>

          {/* Right Section: Date + Theme Toggle + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{/* Date Display */}
            <span className="hidden sm:inline text-xs sm:text-sm text-stone-700 dark:text-gray-400 px-3 py-2 rounded-lg" style={{
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(232, 98, 26, 0.05)',
            }}>
              {getFormattedDate()}
            </span>
            {/* Theme Toggle - Glass Icon Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              style={{
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(232, 98, 26, 0.10)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(232, 98, 26, 0.20)',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(232, 98, 26, 0.15)'
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(232, 98, 26, 0.10)'
              }}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-orange-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-300" />
              )}
            </button>

            {/* Logout Button - Outlined Pill */}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-full backdrop-blur-sm"
              style={{
                color: theme === 'dark' ? '#fbbf24' : '#ea580c',
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(232, 98, 26, 0.10)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(232, 98, 26, 0.30)',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.10)'
                  : 'rgba(232, 98, 26, 0.15)'
                target.style.boxShadow = theme === 'dark'
                  ? '0 0 12px rgba(251, 191, 36, 0.10)'
                  : '0 0 12px rgba(232, 98, 26, 0.15)'
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(232, 98, 26, 0.10)'
                target.style.boxShadow = 'none'
              }}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
