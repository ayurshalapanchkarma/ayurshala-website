'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-10 w-auto mb-6" />
        </Link>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-serif text-orange-600 mb-2">Patient Dashboard</h1>
          <p className="text-stone-600 mb-6">Welcome, {user?.email}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/book" className="p-6 border border-orange-200 rounded-lg hover:bg-orange-50 transition">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">Book Appointment</h2>
              <p className="text-stone-600">Schedule a new appointment</p>
            </Link>

            <Link href="/my-bookings" className="p-6 border border-orange-200 rounded-lg hover:bg-orange-50 transition">
              <h2 className="text-xl font-semibold text-stone-900 mb-2">My Bookings</h2>
              <p className="text-stone-600">View your appointments</p>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-stone-200">
            <button
              onClick={() => {
                import('@supabase/supabase-js').then(({ createClient }) => {
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
                  )
                  supabase.auth.signOut().then(() => router.push('/'))
                })
              }}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
