'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function GlassBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{
        background: dark
          ? 'linear-gradient(135deg, #0a1a0c 0%, #111a0e 40%, #0d1510 70%, #0a120d 100%)'
          : 'linear-gradient(135deg, #fdf6ee 0%, #fff8f0 40%, #f0faf5 70%, #fffbf5 100%)',
      }} />

      {/* Blob 1 — orange, top-left */}
      <div className="absolute rounded-full" style={{
        width: '65vw', height: '65vw',
        top: '-15%', left: '-15%',
        background: dark
          ? 'radial-gradient(circle, rgba(232,98,26,0.35) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(232,98,26,0.28) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'bg-blob1 16s ease-in-out infinite',
      }} />

      {/* Blob 2 — green, bottom-right */}
      <div className="absolute rounded-full" style={{
        width: '60vw', height: '60vw',
        bottom: '-15%', right: '-15%',
        background: dark
          ? 'radial-gradient(circle, rgba(74,124,89,0.30) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(74,124,89,0.22) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'bg-blob2 20s ease-in-out infinite',
      }} />

      {/* Blob 3 — amber, center-right */}
      <div className="absolute rounded-full" style={{
        width: '45vw', height: '45vw',
        top: '30%', right: '5%',
        background: dark
          ? 'radial-gradient(circle, rgba(245,166,35,0.20) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 65%)',
        filter: 'blur(70px)',
        animation: 'bg-blob3 24s ease-in-out infinite',
      }} />

      {/* Blob 4 — teal, center-left */}
      <div className="absolute rounded-full" style={{
        width: '40vw', height: '40vw',
        top: '50%', left: '5%',
        background: dark
          ? 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 65%)'
          : 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 65%)',
        filter: 'blur(70px)',
        animation: 'bg-blob1 28s ease-in-out infinite reverse',
      }} />

      {/* Frosted glass overlay */}
      <div className="absolute inset-0" style={{
        backdropFilter: 'blur(0px)',
        background: dark
          ? 'rgba(10,20,12,0.10)'
          : 'rgba(255,255,255,0.15)',
      }} />
    </div>
  )
}
