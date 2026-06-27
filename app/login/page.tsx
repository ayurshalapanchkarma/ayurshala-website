'use client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getOAuthRedirectUrl } from '@/lib/auth-config'
import { Calendar, FileText, User, Lock } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function PatientLogin() {
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && theme === 'dark'

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getOAuthRedirectUrl() },
    })
    if (error) console.error('OAuth error:', error)
  }

  const features = [
    { icon: Calendar, text: 'Book appointments' },
    { icon: Calendar, text: 'View appointments' },
    { icon: FileText, text: 'Download certificates' },
    { icon: FileText, text: 'Access treatment history' },
    { icon: User, text: 'Manage profile securely' },
  ]

  const bg = dark ? 'linear-gradient(135deg,#0a0f0a,#1a1008)' : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)'
  const cardStyle = {
    background: dark ? 'rgba(30, 27, 25, 0.45)' : 'rgba(255, 255, 255, 0.45)',
    backdropFilter: 'blur(32px) saturate(1.8)',
    border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.4)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: bg }}>
      <div className="w-full max-w-md rounded-3xl p-8 relative" style={cardStyle}>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl mb-2" style={{ color: dark ? '#f5f0e8' : '#1a1008' }}>Secure Patient Login</h1>
          <p className="font-sans text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Sign in with your Google account to securely access your appointments, certificates, treatment records, and healthcare information.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <feature.icon size={16} style={{ color: '#E8621A' }} />
              <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">{feature.text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-xl bg-white/70 dark:bg-stone-800/70 text-stone-700 dark:text-stone-100 font-sans text-sm hover:bg-white/90 dark:hover:bg-stone-800/90 transition-all flex items-center justify-center gap-2 mb-4 border border-white/50 dark:border-stone-700/50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-xl bg-white/50 dark:bg-stone-800/40 hover:bg-white/70 dark:hover:bg-stone-800/60 border border-white/40 dark:border-stone-700/40 text-stone-700 dark:text-stone-200 font-sans text-sm transition-all"
        >
          Back to Home
        </button>

        <p className="text-center text-xs text-stone-600 dark:text-stone-500 mt-6">
          Your healthcare information is secure and encrypted.
        </p>
      </div>
    </div>
  )
}
