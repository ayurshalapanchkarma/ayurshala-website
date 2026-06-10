'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        router.push('/admin/login')
        return
      }

      try {
        // Check by email since OAuth doesn't create users in auth.users with the same id
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!admin) {
          router.push('/unauthorized')
          return
        }

        setIsAdmin(true)
      } catch {
        router.push('/unauthorized')
      } finally {
        setChecking(false)
      }
    }

    if (!loading) {
      checkAdmin()
    }
  }, [loading, user, router])

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </motion.div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
