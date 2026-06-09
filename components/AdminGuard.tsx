'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timeout safeguard - if loading takes > 10 seconds, something is wrong
  useEffect(() => {
    const timer = setInterval(() => {
      if (loading) {
        console.warn('AdminGuard: Profile loading timeout (10s)')
        setTimedOut(true)
      }
    }, 10000)
    return () => clearInterval(timer)
  }, [loading])

  useEffect(() => {
    console.log({
      loading,
      user: user?.email,
      profile,
      role: profile?.role,
      isAdmin: profile?.role === 'ADMIN'
    })

    // If still loading, wait
    if (loading) return

    // If timeout occurred, show error
    if (timedOut) {
      setError('Unable to verify permissions. Please refresh the page.')
      return
    }

    // No user - redirect to login
    if (!user) {
      console.log('No user, redirecting to /login')
      router.push('/login')
      return
    }

    // Profile fetch failed or missing
    if (!profile) {
      setError('Unable to load user profile. Please refresh the page.')
      return
    }

    // User is admin - allow access
    if (profile.role === 'ADMIN') {
      console.log('Admin user, granting access')
      return
    }

    // User is not admin - redirect
    console.log(`User is ${profile.role}, redirecting to /dashboard`)
    setRedirecting(true)
    const redirect = profile.role === 'DOCTOR' ? '/doctor' : profile.role === 'RECEPTIONIST' ? '/reception' : '/dashboard'
    
    // Show notification event
    const event = new CustomEvent('notify', {
      detail: { message: 'You are not authorized to access the Admin Portal.', type: 'error' }
    })
    window.dispatchEvent(event)

    // Redirect after 2 seconds
    const redirectTimer = window.setTimeout(() => {
      router.push(redirect)
    }, 2000)

    return () => clearTimeout(redirectTimer)
  }, [loading, user, profile, timedOut, router])

  // Timeout error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Error</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  // Redirecting
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  // No user
  if (!user) {
    return null // Will redirect to login
  }

  // No profile
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Profile Not Found</h1>
          <p className="text-stone-600 mb-6">Unable to load your profile. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Not admin
  if (profile.role !== 'ADMIN') {
    return null // Will redirect via useEffect
  }

  // Admin - render content
  return <>{children}</>
}
