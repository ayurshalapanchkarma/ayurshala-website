import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { RescheduleRejected } from '@/lib/email-template'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const booking_id = req.nextUrl.searchParams.get('booking_id')
  const secret = req.nextUrl.searchParams.get('secret')

  if (secret !== (process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm'))
    return NextResponse.redirect(new URL('/status/reschedule?type=unauthorized', req.url))
  
  if (!booking_id)
    return NextResponse.redirect(new URL('/status/reschedule?type=missing', req.url))

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking)
    return NextResponse.redirect(new URL('/status/reschedule?type=not_found', req.url))

  if (booking.status !== 'RESCHEDULED')
    return NextResponse.redirect(new URL(`/status/reschedule?type=already_processed&booking_id=${booking_id}`, req.url))

  await supabase.from('bookings_new').update({ status: 'CANCELLED', old_date: null, old_time: null, new_date: null, new_time: null, updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  if (patient?.email) {
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const html = RescheduleRejected({ patientName: patient.full_name, bookingId: booking_id })
    resend.emails.send({ from, to: patient.email, subject: `Reschedule Rejected — ${booking_id}`, html }).catch(() => {})
  }

  return NextResponse.redirect(new URL(`/status/reschedule?type=rejected&booking_id=${booking_id}`, req.url))
}

export async function POST(req: NextRequest) {
  const { booking_id } = await req.json()
  if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'RESCHEDULED') return NextResponse.json({ error: 'No pending reschedule' }, { status: 400 })

  await supabase.from('bookings_new').update({ status: 'CANCELLED', old_date: null, old_time: null, new_date: null, new_time: null, updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

  return NextResponse.json({ success: true })
}
