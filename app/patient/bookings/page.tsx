'use client'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
      console.log('Auth User:', user)

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('google_user_id', user?.id)
        .single()

      if (!patient) {
        setBookings([])
        setBookingsLoading(false)
        return
      }

      const { data } = await supabase
        .from('bookings_new')
        .select('*')
        .eq('patient_uuid', patient.id)
        .order('created_at', { ascending: false })

      console.log('Bookings:', data)
      console.log('Bookings Length:', data?.length)

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

  return (
    <pre style={{ padding: 40 }}>
      {JSON.stringify(bookings, null, 2)}
    </pre>
  )
}
