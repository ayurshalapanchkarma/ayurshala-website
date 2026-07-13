'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AdminPremiumHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backTo?: string
}

/**
 * AdminPremiumHeader — ONE header used across ALL admin modules.
 *
 * Glass style is taken from InventoryNavbar (the premium one) and applied
 * everywhere:
 *   - backdrop-filter: blur(12px) saturate(180%) contrast(1.05) brightness(1.08)
 *   - border: 1px solid rgba(232,98,26,0.18)   ← orange tint, same as website Navbar
 *   - boxShadow: orange-tinted inset + drop shadow
 *   - rounded-2xl sm:rounded-3xl
 *   - m-3 so it floats off the edges with a gap
 *   - btn-glass pill buttons
 */
export default function AdminPremiumHeader({
  title = 'Ayurshala Admin Console',
  subtitle = 'Clinical Management System',
  showBackButton = false,
  backTo = '/admin',
}: AdminPremiumHeaderProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

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
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('admin-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
      toast.success('Logged out successfully')
    } catch {
      toast.error('Logout failed')
    }
  }

  if (!mounted) return null

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="sticky top-0 z-40 px-2 sm:px-4 pt-2 sm:pt-3"
    >
      {/* ── Glass pill — EXACT same style as InventoryNavbar / website Navbar ── */}
      <div
        className="w-full rounded-2xl sm:rounded-3xl transition-all duration-300"
        style={{
          background: theme === 'dark'
            ? 'rgba(15,26,18,0.08)'
            : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%) contrast(1.05) brightness(1.08)',
          border: '1px solid rgba(232,98,26,0.18)',
          boxShadow:
            '0 8px 32px rgba(232,98,26,0.06), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="px-3 sm:px-6 md:px-8 flex items-center justify-between h-14 sm:h-16 md:h-20">

          {/* Left: back arrow (optional) + logo + title */}
          <div className="flex items-center h-full py-1 sm:py-2 gap-3 sm:gap-4 flex-1 min-w-0">

            {showBackButton && (
              <button
                onClick={() => router.push(backTo)}
                className="btn-glass p-2 flex-shrink-0"
                title="Go back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Logo */}
            <div className="flex items-center h-full flex-shrink-0">
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={260}
                height={80}
                className="object-contain h-full w-auto max-w-[56px] sm:max-w-[64px]"
                priority
              />
            </div>

            {/* Title + Subtitle */}
            <div className="hidden sm:flex flex-col justify-center min-w-0">
              <h1 className="text-base md:text-lg font-semibold tracking-wide text-stone-900 dark:text-stone-100 leading-tight whitespace-nowrap">
                {title}
              </h1>
              <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 opacity-75 tracking-wider whitespace-nowrap">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: theme toggle + logout — pill buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            <button
              onClick={toggleTheme}
              className="btn-glass text-xs py-2 px-3 sm:px-4 flex items-center gap-2 flex-shrink-0"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

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
      </div>
    </motion.header>
  )
}
