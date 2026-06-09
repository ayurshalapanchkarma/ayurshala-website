'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      // Wait for onAuthStateChange to fire (OAuth redirect sets session)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const next = new URLSearchParams(window.location.search).get('next') || '/my-bookings'
          subscription.unsubscribe()
          router.replace(next)
        }
      })
      
      // Also check immediately in case session is already set
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const next = new URLSearchParams(window.location.search).get('next') || '/my-bookings'
        subscription.unsubscribe()
        router.replace(next)
      }
      
      // Timeout after 8 seconds
      setTimeout(() => {
        setChecking(false)
        subscription.unsubscribe()
      }, 8000)
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
