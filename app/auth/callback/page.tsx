'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      console.log('OAuth callback started')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log('Session:', session)
      console.log('Error:', error)

      if (session?.user) {
        const userEmail = session.user.email
        console.log('User authenticated:', userEmail)

        // Check URL for admin flag
        const params = new URLSearchParams(window.location.search)
        const isAdminFlow = params.get('admin') === 'true'

        if (isAdminFlow) {
          // Check if user is in admins table by email
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', userEmail)
            .single()

          if (admin) {
            console.log('User is admin, redirecting to /admin')
            router.replace('/admin')
          } else {
            console.log('User is not admin, redirecting to /unauthorized')
            router.replace('/unauthorized')
          }
        } else {
          // Patient flow - check if user is admin, else go to patient dashboard
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', userEmail)
            .single()

          if (admin) {
            console.log('User is admin, redirecting to /admin')
            router.replace('/admin')
          } else {
            console.log('User is patient, redirecting to /patient/dashboard')
            router.replace('/patient/dashboard')
          }
        }
      } else {
        console.log('No session found, redirecting to login')
        router.replace('/admin/login')
      }

      setTimeout(() => {
        setChecking(false)
      }, 2000)
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-sans text-stone-400 text-sm">
        {checking ? 'Signing you in…' : 'Redirecting…'}
      </p>
    </div>
  )
}
