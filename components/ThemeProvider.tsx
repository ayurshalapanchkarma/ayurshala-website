'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme-preference')
    if (stored) setTheme(stored)
  }, [setTheme])

  useEffect(() => {
    if (!mounted) return
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme-preference', theme || 'light')
  }, [theme, mounted])

  if (!mounted) return <>{children}</>
  return <>{children}</>
}
