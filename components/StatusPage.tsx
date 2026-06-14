'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, XCircle, AlertCircle, Info, Phone, Mail } from 'lucide-react'
import GlassBackground from './GlassBackground'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'cancelled'

const statusConfig = {
  success: { icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', gradStart: '#f0fdf4', gradEnd: '#dcfce7' },
  error: { icon: XCircle, color: '#dc2626', bg: '#fee2e2', gradStart: '#fee2e2', gradEnd: '#fecaca' },
  warning: { icon: AlertCircle, color: '#ea580c', bg: '#fff7ed', gradStart: '#fff7ed', gradEnd: '#fed7aa' },
  info: { icon: Info, color: '#2563eb', bg: '#eff6ff', gradStart: '#eff6ff', gradEnd: '#dbeafe' },
  cancelled: { icon: XCircle, color: '#991b1b', bg: '#fee2e2', gradStart: '#fee2e2', gradEnd: '#fecaca' },
}

export default function StatusPage({
  statusType,
  title,
  description,
  bookingId,
  patientName,
  primaryAction,
  secondaryAction,
  showSupport = true,
}: {
  statusType: StatusType
  title: string
  description: string
  bookingId?: string
  patientName?: string
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
  showSupport?: boolean
}) {
  const config = statusConfig[statusType]
  const Icon = config.icon
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  return (
    <div className={`min-h-screen px-4 sm:px-6 py-16 sm:py-20 relative overflow-hidden flex items-center justify-center transition-colors ${
      isDark ? 'bg-slate-950' : 'bg-orange-50'
    }`}
      style={!isDark ? { background: `linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)` } : undefined}>
      <GlassBackground />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none animate-blob1"
          style={{ background: 'radial-gradient(circle,#4a7c59 0%,transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-35 pointer-events-none animate-blob2"
          style={{ background: 'radial-gradient(circle,#E8621A 0%,transparent 70%)' }} />
      </div>

      <div className="max-w-md w-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7 }}
          className={`rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl border ${
            isDark 
              ? 'bg-slate-900/80 border-slate-700/50' 
              : 'bg-white/85 border-white/40'
          }`}
          style={{ boxShadow: '0 12px 40px rgba(255,165,0,0.08)' }}>
          
          <div className="flex justify-center mb-5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg,rgba(${parseInt(config.color.slice(1, 3), 16)},${parseInt(config.color.slice(3, 5), 16)},${parseInt(config.color.slice(5, 7), 16)},0.15),rgba(${parseInt(config.color.slice(1, 3), 16)},${parseInt(config.color.slice(3, 5), 16)},${parseInt(config.color.slice(5, 7), 16)},0.25))`,
                border: `1.5px solid rgba(${parseInt(config.color.slice(1, 3), 16)},${parseInt(config.color.slice(3, 5), 16)},${parseInt(config.color.slice(5, 7), 16)},0.3)`
              }}>
              <Icon className="w-8 h-8" style={{ color: config.color }} />
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-3" />
            <h1 className={`font-serif text-3xl mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`} style={{ color: isDark ? undefined : config.color }}>
              {title}
            </h1>
            <p className={`font-sans text-sm ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>{description}</p>
          </div>

          {(bookingId || patientName) && (
            <div className={`rounded-2xl overflow-hidden mb-6 backdrop-blur-2xl border ${
              isDark 
                ? 'border-slate-700/30 bg-slate-800/40' 
                : 'border-white/20 bg-white/40'
            }`}
              style={{ boxShadow: '0 12px 48px rgba(255,165,0,0.08)' }}>
              {bookingId && (
                <div className={`px-4 py-3 ${isDark ? 'border-slate-700/20' : 'border-white/10'} border-b`}>
                  <p className={`text-xs uppercase font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>Booking ID</p>
                  <p className={`text-sm font-mono font-semibold tracking-wide mt-1.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>{bookingId}</p>
                </div>
              )}
              {patientName && (
                <div className="px-4 py-3">
                  <p className={`text-xs uppercase font-medium tracking-wide ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>Patient</p>
                  <p className={`text-sm font-medium mt-1.5 ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>{patientName}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {primaryAction && (
              <Link href={primaryAction.href} className="w-full px-4 py-3 rounded-lg text-center font-semibold transition text-white hover:opacity-90 active:scale-95"
                style={{ background: config.color }}>
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href} className={`w-full px-4 py-3 rounded-lg text-center font-semibold transition border ${
                isDark
                  ? 'border-slate-600 text-gray-200 hover:bg-slate-700/50'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}>
                {secondaryAction.label}
              </Link>
            )}
          </div>

          {showSupport && (
            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-700/30' : 'border-white/20'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-3 ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>Need Assistance?</p>
              <div className="space-y-2">
                <a href="tel:+919821224767" className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'} transition`}>
                  <Phone className="w-4 h-4" />
                  <span>+91-9821224767</span>
                </a>
                <a href="mailto:admin@ayurshalapanchkarma.com" className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'} transition`}>
                  <Mail className="w-4 h-4" />
                  <span className="truncate">admin@ayurshalapanchkarma.com</span>
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
