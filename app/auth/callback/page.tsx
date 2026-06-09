'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      // Check if session exists
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Already signed in, redirect
        const next = new URLSearchParams(window.location.search).get('next') || '/book'
        router.replace(next)
      } else {
        // Wait for auth state change (OAuth redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === 'SIGNED_IN' && newSession) {
            const next = new URLSearchParams(window.location.search).get('next') || '/book'
            router.replace(next)
            subscription.unsubscribe()
          }
        })
        
        // Timeout after 5 seconds
        setTimeout(() => {
          setChecking(false)
          subscription.unsubscribe()
        }, 5000)
      }
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
