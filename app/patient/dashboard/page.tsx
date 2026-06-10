'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarPlus, CalendarCheck, LogOut } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function PatientDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [patient, setPatient] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    } else if (user?.id) {
      supabase.from('patients').select('patient_id').eq('id', user.id).single().then(({ data }) => {
        setPatient(data)
      })
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/">
              <Image src="/ayurshala_text.png" alt="Ayurshala" width={160} height={48} className="object-contain h-10 sm:h-12 w-auto" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif text-orange-600">My Dashboard</h1>
              <p className="text-sm text-stone-600">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* My Bookings */}
          <div
            onClick={() => {
              console.log('Navigating to patient bookings')
              router.push('/patient/bookings')
            }}
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition border border-stone-200 hover:border-orange-300 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarCheck className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-semibold text-stone-900">My Bookings</h2>
            </div>
            <p className="text-sm text-stone-600">View and manage your appointments</p>
          </div>

          {/* Book Appointment */}
          <div
            onClick={() => {
              console.log('Navigating to book appointment')
              router.push('/book-appointment')
            }}
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition border border-stone-200 hover:border-orange-300 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarPlus className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-stone-900">Book Appointment</h2>
            </div>
            <p className="text-sm text-stone-600">Schedule a new appointment</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-12 p-6 bg-white rounded-2xl shadow border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-stone-600">Email:</p>
              <p className="font-medium text-stone-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-stone-600">Patient ID:</p>
              <p className="font-medium text-stone-900">{patient?.patient_id || '—'}</p>
            </div>
            <div>
              <p className="text-stone-600">Role:</p>
              <p className="font-medium text-stone-900">Patient</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
