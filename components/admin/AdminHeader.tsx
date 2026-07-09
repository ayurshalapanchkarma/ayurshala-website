'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
}

/**
 * AdminHeader - Premium glasmorphic header matching Ayurshala website
 * 
 * Features:
 * - Glasmorphic design (backdrop blur + transparency)
 * - Ayurshala branding (logo + customizable title)
 * - Optional subtitle
 * - Theme toggle (light/dark mode)
 * - Logout button
 * - Responsive design (mobile, tablet, desktop)
 * - Matches website header styling exactly
 * - Light & Dark theme support
 */
export default function AdminHeader({ 
  title = 'Ayurshala Admin',
  subtitle = 'Clinical Management System'
}: AdminHeaderProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('admin-theme')
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
    localStorage.setItem('admin-theme', newTheme)
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  if (!mounted) return null

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-40"
    >
      <div
        className="rounded-none overflow-hidden transition-all duration-300 mx-3 mt-3 rounded-2xl"
        style={{
          background: theme === 'dark'
            ? 'rgba(15, 23, 42, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: theme === 'dark'
            ? '1px solid rgba(148, 163, 184, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: theme === 'dark'
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          
          {/* Left Section: Logo + Title + Subtitle */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={260}
                height={80}
                className="h-7 sm:h-9 w-auto"
                priority
              />
            </div>

            {/* Title + Subtitle */}
            <div className="flex flex-col min-w-0 hidden sm:flex">
              <h1 className={`text-sm sm:text-base font-semibold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Section: Theme Toggle + Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Theme Toggle Button - Icon only */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
              className="p-2 sm:p-2.5 rounded-lg transition-all duration-200"
              style={{
                background: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                border: theme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
              style={{
                background: theme === 'dark'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(239, 68, 68, 0.08)',
                border: theme === 'dark'
                  ? '1px solid rgba(239, 68, 68, 0.2)'
                  : '1px solid rgba(239, 68, 68, 0.1)',
                color: theme === 'dark' ? '#fca5a5' : '#dc2626',
              }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
