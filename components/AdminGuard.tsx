'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect to appropriate dashboard based on role
      const redirect = profile?.role === 'DOCTOR' ? '/doctor' : profile?.role === 'RECEPTIONIST' ? '/reception' : '/dashboard'
      router.push(redirect)
    }
  }, [loading, isAdmin, profile?.role, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Access Denied</h1>
          <p className="text-stone-600 mb-6">You are not authorized to access this page.</p>
          <a href="/dashboard" className="text-orange-500 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
