'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      router.replace('/book')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-sans text-stone-400 text-sm">Signing you in…</p>
    </div>
  )
}
