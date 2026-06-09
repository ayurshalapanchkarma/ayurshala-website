'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, RotateCcw, Home, ArrowRight } from 'lucide-react'
import GlassBackground from '@/components/GlassBackground'

export default function PaymentFailedPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const dark = mounted && theme === 'dark'

  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen px-4 sm:px-6 py-20 sm:py-24 relative overflow-hidden flex items-center justify-center"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm rounded-3xl p-8 backdrop-filter backdrop-blur-xl border"
        style={{
          background: dark ? 'rgba(15,26,18,0.8)' : 'rgba(255,248,240,0.85)',
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          boxShadow: '0 20px 80px rgba(232,98,26,0.12), inset 0 1px 0 rgba(255,255,255,1)',
        }}>
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.1)' }}>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </motion.div>
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-10 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2" style={{ color: '#dc2626' }}>Payment Failed</h1>
          <p className="font-sans text-sm text-stone-500">Your payment could not be processed</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 rounded-xl border"
          style={{ borderColor: 'rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.05)' }}>
          <p className="font-sans text-xs text-stone-600 mb-2 font-semibold">What happened?</p>
          <ul className="font-sans text-xs text-stone-500 space-y-1.5">
            <li>• Your payment was declined or timed out</li>
            <li>• You cancelled the payment</li>
            <li>• A network error occurred</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 rounded-xl border"
          style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)' }}>
          <p className="font-sans text-xs text-stone-600 mb-1 font-semibold">Your booking is safe</p>
          <p className="font-sans text-xs text-stone-500">Your booking has been saved. Complete payment to confirm your appointment.</p>
        </motion.div>

        <div className="flex gap-3 flex-col">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/my-bookings" className="btn-glass w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold">
              <RotateCcw className="w-4 h-4" /> Retry Payment
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/book" className="btn-glass w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold">
              <ArrowRight className="w-4 h-4" /> New Booking
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/" className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">
              <Home className="w-4 h-4" /> Back Home
            </Link>
          </motion.div>
        </div>

        <p className="font-sans text-xs text-stone-400 text-center mt-6">Need help? <a href="tel:+919821224767" className="font-semibold hover:text-brand transition-colors">+91-9821224767</a></p>
      </motion.div>
    </div>
  )
}
