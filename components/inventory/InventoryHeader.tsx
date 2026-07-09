'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Sun, Moon, LogOut } from 'lucide-react'
import { toast } from 'sonner'

/**
 * InventoryHeader - Minimal global header for entire Inventory module
 * 
 * Layout:
 * [Logo] Ayurshala Inventory    [Theme Toggle] [Logout]
 * 
 * Features:
 * - Ayurshala logo (40x40)
 * - "Ayurshala Inventory" title (semibold, large)
 * - Single theme toggle button (☀️/🌙)
 * - Simple logout button
 * - Light/Dark mode support
 * - Responsive design
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        
        {/* Left Section: Logo + Title */}
        <div className="flex items-center gap-3 flex-1">
          <Image
            src="/ayurshala_text.png"
            alt="Ayurshala"
            width={40}
            height={40}
            priority
            className="flex-shrink-0"
          />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
            Ayurshala Inventory
          </h1>
        </div>

        {/* Right Section: Theme Toggle + Logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-700 dark:text-gray-300 transition duration-200"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition duration-200"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
