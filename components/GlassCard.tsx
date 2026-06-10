import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`rounded-3xl p-8 backdrop-blur-md border transition ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        boxShadow: '0 8px 32px rgba(232, 98, 26, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {children}
    </div>
  )
}
