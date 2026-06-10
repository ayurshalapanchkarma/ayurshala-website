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
        console.log('User authenticated:', session.user.email)

        // Check if user is admin
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('id', session.user.id)
          .single()

        let redirectTarget = '/patient/dashboard'
        if (admin) {
          console.log('User is admin, redirecting to /admin')
          redirectTarget = '/admin'
        } else {
          console.log('User is patient, redirecting to /patient/dashboard')
        }

        // Get next parameter from URL
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        if (next && ['/book', '/my-bookings'].includes(next)) {
          redirectTarget = next
          console.log('Using next parameter:', redirectTarget)
        }

        console.log('Final redirect:', redirectTarget)
        router.replace(redirectTarget)
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
