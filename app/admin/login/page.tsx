'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dark = theme === 'dark'

  async function handleLogin() {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      })
      const { success } = await res.json()

      if (success) {
        localStorage.setItem('adminSessionTime', Date.now().toString())
        router.push('/admin')
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <ShieldCheck className="w-8 h-8" style={{ color: '#E8621A' }} />
          </div>
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={200} height={56} className="object-contain h-14 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-2xl mb-1" style={{ color: '#E8621A' }}>Admin Login</h1>
          <p className="font-sans text-xs text-stone-400">Secure admin access</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-600 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ayurshalapanchkarma@gmail.com"
            className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md"
            disabled
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-600 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            className="w-full rounded-xl px-4 py-3 font-sans text-sm bg-white/50 border border-white/80 focus:outline-none focus:border-orange-300 backdrop-blur-md"
          />
        </div>

        {error && <p className="font-sans text-xs text-red-500 mb-4 text-center">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-sans text-sm hover:bg-orange-600 transition disabled:opacity-50 mb-3"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full py-2.5 rounded-xl bg-white/40 text-stone-700 font-sans text-sm hover:bg-white/60 transition border border-white/60"
        >
          Cancel
        </button>

        <p className="text-center text-xs text-stone-500 mt-6">
          Secure access for administrators only
        </p>
      </motion.div>
    </div>
  )
}
