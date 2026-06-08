'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export default function PaymentFailedPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  return (
    <div className="min-h-screen px-6 py-16 relative overflow-hidden flex items-center justify-center"
      style={{ background: dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)' }}>
      <GlassBackground />

      <div className="max-w-md w-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 20px 80px rgba(220,38,38,0.10), 0 4px 24px rgba(0,0,0,0.08)',
          }}>

          <div className="text-center mb-8">
            <Link href="/"><Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-6" /></Link>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(220,38,38,0.12)', border: '1.5px solid rgba(220,38,38,0.3)' }}>
              <span className="text-3xl">✕</span>
            </motion.div>

            <h1 className="font-serif text-3xl mb-2" style={{ color: '#dc2626' }}>Payment Failed</h1>
            <p className="font-sans text-sm text-stone-400 leading-relaxed">
              Your payment could not be processed.<br />No amount has been deducted.
            </p>
          </div>

          <div className={`rounded-2xl p-4 mb-6 border text-center ${dark ? 'border-red-900/40 bg-red-950/20' : 'border-red-100 bg-red-50'}`}>
            <p className="font-sans text-sm text-red-600">Your booking slot is still reserved. You can try again or choose Cash on Arrival.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/book" className="btn-glass w-full text-sm py-3 text-center">🔄 Try Booking Again</Link>
            <Link href="/" className="btn-glass w-full text-sm py-3 text-center">← Back to Home</Link>
          </div>

          <p className="font-sans text-xs text-stone-400 text-center mt-4">
            Need help? Call <a href="tel:+919821224767" className="text-brand">+91-9821224767</a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
