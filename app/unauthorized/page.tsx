'use client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { ShieldX } from 'lucide-react'

export default function Unauthorized() {
  const router = useRouter()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 20px 80px rgba(232,98,26,0.12), 0 4px 24px rgba(0,0,0,0.08)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <GlassBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md rounded-3xl p-8 relative overflow-hidden"
        style={cardStyle}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ShieldX className="w-12 h-12" style={{ color: '#dc2626' }} />
          </div>
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-2xl mb-1" style={{ color: '#dc2626' }}>Unauthorized Access</h1>
          <p className="font-sans text-xs text-stone-400">The Google account you used does not have administrator privileges.</p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-sans text-sm hover:bg-orange-600 transition mb-3"
        >
          Return Home
        </button>

        <button
          onClick={() => router.push('/admin/login')}
          className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60"
        >
          Sign in with another account
        </button>
      </motion.div>
    </div>
  )
}
