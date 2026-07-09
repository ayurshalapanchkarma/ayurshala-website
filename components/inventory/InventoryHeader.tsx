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
 * - Floating glass panel design
 * - Ayurshala logo (44-48px)
 * - "Ayurshala Inventory" title with subtitle
 * - Subtitle: "Inventory • Procurement • Stock Control"
 * - Theme toggle (glass icon button)
 * - Logout (outlined pill button)
 * - Smooth fade + slide-down animation on load
 * - Sticky positioning
 * - Light & Dark mode support
 * - Premium, minimal, elegant design
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

  if (!mounted) return null

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 px-5 mt-4 mb-5"
    >
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: theme === 'dark'
            ? 'rgba(15, 23, 42, 0.65)'
            : 'rgba(255, 255, 255, 0.70)',
          backdropFilter: 'blur(20px) saturate(180%) brightness(1.05)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.05)',
          border: theme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.10)'
            : '1px solid rgba(226, 232, 240, 0.80)',
          boxShadow: theme === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 8px 32px rgba(203, 213, 225, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        <div className="px-8 py-5 flex items-center justify-between gap-4">
          
          {/* Left Section: Logo + Title & Subtitle */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={48}
                height={48}
                priority
                className="h-12 w-auto"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">
                Ayurshala Inventory
              </h1>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide mt-0.5">
                Inventory • Procurement • Stock Control
              </p>
            </div>
          </div>

          {/* Right Section: Theme Toggle + Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Theme Toggle - Glass Icon Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              style={{
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(226, 232, 240, 0.40)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(203, 213, 225, 0.60)',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(226, 232, 240, 0.60)'
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(226, 232, 240, 0.40)'
              }}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-gray-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-300" />
              )}
            </button>

            {/* Logout Button - Outlined Pill */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-200 rounded-full backdrop-blur-sm"
              style={{
                color: theme === 'dark' ? '#e0e7ff' : '#1f2937',
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(226, 232, 240, 0.30)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(203, 213, 225, 0.70)',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.10)'
                  : 'rgba(226, 232, 240, 0.50)'
                target.style.boxShadow = theme === 'dark'
                  ? '0 0 12px rgba(255, 255, 255, 0.08)'
                  : '0 0 12px rgba(203, 213, 225, 0.20)'
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.background = theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(226, 232, 240, 0.30)'
                target.style.boxShadow = 'none'
              }}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
