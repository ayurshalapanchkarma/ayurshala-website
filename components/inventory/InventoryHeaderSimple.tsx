'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Sun, Moon, LogOut } from 'lucide-react'
import { toast } from 'sonner'

/**
 * InventoryHeaderSimple - Simplified header for Inventory pages
 * Features:
 * - Back button (returns to /admin/inventory)
 * - Page title & subtitle
 * - Light/Dark theme toggle
 * - Profile menu with logout
 */
export default function InventoryHeaderSimple() {
  const router = useRouter()
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showProfile, setShowProfile] = useState(false)
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

  const getPageInfo = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length <= 2) {
      return { title: 'Inventory', subtitle: 'Dashboard' }
    }
    
    const lastSegment = segments[segments.length - 1]
    const title = lastSegment
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    
    return { title, subtitle: 'Inventory' }
  }

  const { title, subtitle } = getPageInfo()
  const isInventoryHome = pathname === '/admin/inventory'

  if (!mounted) return null

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Left section: Back button & Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {!isInventoryHome && (
            <button
              onClick={() => router.push('/admin/inventory')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right section: Theme toggle & Profile */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-700 dark:text-gray-300 transition"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <Image
                src="/ayurshala_text.png"
                alt="Ayurshala"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline">
                Ayurshala
              </span>
            </button>

            {/* Profile dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <p className="font-semibold text-gray-900 dark:text-white">Ayurshala</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ayurshalapanchkarma@gmail.com</p>
                </div>

                <button
                  onClick={() => {
                    router.push('/admin/inventory')
                    setShowProfile(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition border-b border-gray-200 dark:border-slate-700"
                >
                  Profile
                </button>

                <button
                  onClick={() => {
                    toggleTheme()
                    setShowProfile(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition border-b border-gray-200 dark:border-slate-700"
                >
                  Toggle Theme
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
