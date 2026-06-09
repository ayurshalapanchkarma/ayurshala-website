'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return // Wait for profile to load

    console.log({
      userEmail: user?.email,
      profileRole: profile?.role,
      isAdmin: profile?.role === 'ADMIN'
    })

    // If no user, redirect to login
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/login')
      return
    }

    // If profile not loaded yet, wait
    if (!profile) {
      console.log('Profile not loaded yet, waiting...')
      return
    }

    // If not admin, redirect based on role
    if (profile.role !== 'ADMIN') {
      console.log(`User is ${profile.role}, redirecting...`)
      setRedirecting(true)
      const redirect = profile.role === 'DOCTOR' ? '/doctor' : profile.role === 'RECEPTIONIST' ? '/reception' : '/dashboard'
      router.push(redirect)
      return
    }

    console.log('Admin user, granting access')
  }, [loading, user, profile, router])

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
    return null // Will redirect to login
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (profile.role !== 'ADMIN') {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
