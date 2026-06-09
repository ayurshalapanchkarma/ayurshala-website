'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function AuthCallback() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Check if user is admin
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .single()

          let redirectTarget = '/patient/dashboard'
          if (admin) {
            redirectTarget = '/admin'
          }

          console.log({
            email: session.user.email,
            isAdmin: !!admin,
            redirectTarget
          })

          subscription.unsubscribe()
          router.replace(redirectTarget)
        }
      })

      // Also check immediately
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('id', session.user.id)
          .single()

        let redirectTarget = '/patient/dashboard'
        if (admin) {
          redirectTarget = '/admin'
        }

        console.log({
          email: session.user.email,
          isAdmin: !!admin,
          redirectTarget
        })

        subscription.unsubscribe()
        router.replace(redirectTarget)
      }

      // Timeout
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
