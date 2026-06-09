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
      // Get patient record using google_user_id
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('google_user_id', user.id)
        .single()

      if (!patient) {
        setBookingsLoading(false)
        return
      }

      // Query bookings using patients.id
      const { data } = await supabase
        .from('bookings_new')
        .select('*')
        .eq('patient_uuid', patient.id)
        .order('created_at', { ascending: false })

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/patient/dashboard" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-serif text-orange-600 mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-stone-600 mb-6">No bookings yet</p>
            <Link
              href="/book-appointment"
              className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow p-6 border border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Booking ID</p>
                    <p className="font-mono text-sm font-semibold text-orange-600">{booking.booking_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Date & Time</p>
                    <p className="text-sm font-medium text-stone-900">{booking.preferred_date} at {booking.preferred_time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Status</p>
                    <p className={`text-sm font-medium ${
                      booking.status === 'CONFIRMED' ? 'text-green-600' :
                      booking.status === 'PENDING_CONFIRMATION' ? 'text-amber-600' :
                      booking.status === 'CANCELLED' ? 'text-red-600' :
                      'text-stone-600'
                    }`}>
                      {booking.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase">Payment</p>
                    <p className={`text-sm font-medium ${
                      booking.payment_status === 'PAID' ? 'text-green-600' :
                      booking.payment_status === 'PENDING' ? 'text-amber-600' :
                      'text-stone-600'
                    }`}>
                      {booking.payment_method} - {booking.payment_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
