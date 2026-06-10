'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { CircleCheck, CircleX, AlertCircle } from 'lucide-react'

interface ActionButton {
  label: string
  href: string
  icon?: any
  variant?: 'primary' | 'secondary'
}

interface StatusPageProps {
  title: string
  description: string
  status: 'success' | 'error' | 'warning'
  actionButtons: ActionButton[]
  children?: React.ReactNode
}

const iconMap = {
  success: CircleCheck,
  error: CircleX,
  warning: AlertCircle,
}

const colorMap = {
  success: { bg: 'rgba(22, 163, 74, 0.15)', border: 'rgba(22, 163, 74, 0.3)', icon: '#16a34a' },
  error: { bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.3)', icon: '#dc2626' },
  warning: { bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.3)', icon: '#d97706' },
}

export default function StatusPage({ title, description, status, actionButtons, children }: StatusPageProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  const Icon = iconMap[status]
  const colors = colorMap[status]

  return (
    <div className="min-h-screen px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden flex items-center justify-center"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />

      <div className="max-w-md w-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="rounded-3xl p-8 backdrop-blur-md border"
          style={{
            background: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(18px)',
            border: dark ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 8px 32px rgba(232, 98, 26, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}>

          <div className="text-center mb-6">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
            
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}>
              <Icon className="w-8 h-8" style={{ color: colors.icon }} />
            </motion.div>

            <h1 className="font-serif text-3xl mb-2" style={{ color: '#E8621A' }}>{title}</h1>
            <p className={`font-sans text-sm ${dark ? 'text-stone-400' : 'text-stone-500'}`}>{description}</p>
          </div>

          {children && (
            <div className="mb-6 p-4 rounded-2xl backdrop-blur-md border"
              style={{
                background: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                border: dark ? '1px solid rgba(255, 255, 255, 0.10)' : '1px solid rgba(255, 255, 255, 0.35)',
              }}>
              {children}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {actionButtons.map((btn, i) => {
              const BtnIcon = btn.icon
              return (
                <Link
                  key={i}
                  href={btn.href}
                  className="px-4 py-3 rounded-xl text-sm font-sans transition flex items-center justify-center gap-2"
                  style={btn.variant === 'primary' ? {
                    background: '#E8621A',
                    color: '#fff',
                  } : {
                    background: dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)',
                    color: dark ? '#e7e5e4' : '#1a1008',
                    border: dark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.5)',
                  }}>
                  {BtnIcon && <BtnIcon className="w-4 h-4" />}
                  {btn.label}
                </Link>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
