'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function PatientBookings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    async function fetchBookings() {
      console.log('=== BOOKING FETCH START ===')
      console.log('Auth user:', user)
      console.log('Auth user id:', user?.id)

      // Get patient record using google_user_id
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('google_user_id', user.id)
        .single()

      console.log('Patient lookup result:', patient)
      console.log('Patient lookup error:', patientError)
      console.log('Patient UUID used:', patient?.id)

      if (!patient) {
        console.log('Patient not found - stopping')
        setBookingsLoading(false)
        return
      }

      // Query bookings using patients.id
      const { data, error: bookingsError } = await supabase
        .from('bookings_new')
        .select('*')
        .eq('patient_uuid', patient.id)
        .order('created_at', { ascending: false })

      console.log('Bookings query error:', bookingsError)
      console.log('Bookings returned:', data)
      console.log('Bookings count:', data?.length)
      console.log('First booking sample:', data?.[0])
      console.log('=== BOOKING FETCH END ===')

      setBookings(data || [])
      setBookingsLoading(false)
    }

    fetchBookings()
  }, [user])

  if (loading || bookingsLoading) {
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

  console.log('RENDER STATE - bookings array:', bookings)
  console.log('RENDER STATE - bookings.length:', bookings.length)
  console.log('RENDER STATE - bookingsLoading:', bookingsLoading)

  return (
    <pre style={{ padding: 40 }}>
      {JSON.stringify(bookings, null, 2)}
    </pre>
  )
}
