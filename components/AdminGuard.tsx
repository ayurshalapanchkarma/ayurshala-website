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

  // Timeout safeguard
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
      isAdmin
    })

    if (loading) return

    if (timedOut) {
      setError('Unable to verify permissions. Please refresh the page.')
      return
    }

    if (!user) {
      console.log('No user session, redirecting to /admin/login')
      router.push('/admin/login')
      return
    }

    if (!isAdmin) {
      console.log('User is not admin, redirecting to /patient/dashboard')
      setRedirecting(true)
      router.push('/patient/dashboard')
      return
    }

    console.log('Admin user verified, granting access')
  }, [loading, user, isAdmin, timedOut, router])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return null
  }

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

  if (profile.role !== 'ADMIN') {
    return null
  }

  return <>{children}</>
}

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
