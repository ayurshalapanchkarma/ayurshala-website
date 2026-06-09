import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const payment = req.nextUrl.searchParams.get('payment')

  let query = supabase.from('bookings_new').select('*').eq('is_deleted', false).order('created_at', { ascending: false })
  if (status && status !== 'ALL') query = query.eq('status', status)
  if (payment && payment !== 'ALL' && payment !== 'all') {
    // Map filter values to actual payment_method values
    if (payment === 'ONLINE') query = query.eq('payment_method', 'ONLINE')
    else if (payment === 'CASH_ON_ARRIVAL') query = query.eq('payment_method', 'CASH_ON_ARRIVAL')
  }

  const { data: bookings } = await query
  if (!bookings?.length) return NextResponse.json({ bookings: [] })

  const patientIds = [...new Set(bookings.map(b => b.patient_uuid))]
  const { data: patients } = await supabase.from('patients').select('id,full_name,patient_id,phone,email').in('id', patientIds)
  const bookingIds = bookings.map(b => b.id)
  const { data: treatments } = await supabase.from('booking_treatments_v2').select('booking_uuid,treatment_name').in('booking_uuid', bookingIds)
  const { data: payments } = await supabase.from('payments').select('booking_uuid,amount').in('booking_uuid', bookingIds)

  const result = bookings.map(b => {
    const p = patients?.find(p => p.id === b.patient_uuid)
    const t = treatments?.filter(t => t.booking_uuid === b.id).map(t => t.treatment_name).join(', ') || '—'
    const amount = payments?.find(p => p.booking_uuid === b.id)?.amount || 0
    return { ...b, patient_name: p?.full_name || '—', patient_id: p?.patient_id || '—', patient_phone: p?.phone || '', patient_email: p?.email || '', treatments: t, amount }
  })

  return NextResponse.json({ bookings: result })
}

export async function POST(req: NextRequest) {
  const { action, booking_id } = await req.json()

  if (action === 'confirm') {
    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'CONFIRMED') return NextResponse.json({ error: 'Already confirmed' }, { status: 400 })

    const { data: patient } = await supabase.from('patients').select('full_name,email,patient_id').eq('id', booking.patient_uuid).single()
    const { data: treatments } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatments?.map(t => t.treatment_name).join(', ') || '—'

    await supabase.from('bookings_new').update({ status: 'CONFIRMED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

    // Audit log
    try {
      await supabase.from('appointment_audit').insert({
        booking_uuid: booking.id,
        patient_uuid: booking.patient_uuid,
        action: 'CONFIRMED',
        old_value: { status: booking.status },
        new_value: { status: 'CONFIRMED' },
        performed_by: null,
        created_at: new Date().toISOString()
      })
    } catch (e) {
      // Ignore if audit table doesn't exist
    }

    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const patientEmail = patient?.email
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from,
        to: patientEmail || '',
        subject: `✓ Your Appointment Confirmed - ${booking_id}`,
        html: `<h2>Appointment Confirmed!</h2><p>Dear ${patient?.full_name},</p><p>Your appointment on <strong>${formattedDate} at ${booking.preferred_time}</strong> is confirmed.</p><p><strong>Treatments:</strong> ${treatmentList}</p><p>See you soon!</p>`,
      })

      await resend.emails.send({
        from,
        to: 'ayurshalapanchkarma@gmail.com',
        subject: `Booking Confirmed - ${booking_id} (${patient?.patient_id})`,
        html: `<h3>Booking Confirmed</h3><p>${patient?.full_name} (${patient?.patient_id})</p><p>${formattedDate} · ${booking.preferred_time}</p><p>${treatmentList}</p>`,
      })
    } catch (err) {
      console.error('Email error:', err)
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

    const { data: patient } = await supabase.from('patients').select('full_name,email,patient_id').eq('id', booking.patient_uuid).single()
    const { data: treatments } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatments?.map(t => t.treatment_name).join(', ') || '—'

    await supabase.from('bookings_new').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

    // Audit log
    try {
      await supabase.from('appointment_audit').insert({
        booking_uuid: booking.id,
        patient_uuid: booking.patient_uuid,
        action: 'CANCELLED',
        old_value: { status: booking.status },
        new_value: { status: 'CANCELLED' },
        performed_by: null,
        created_at: new Date().toISOString()
      })
    } catch (e) {
      // Ignore if audit table doesn't exist
    }

    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const patientEmail = patient?.email
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from,
        to: patientEmail || '',
        subject: `Appointment Cancelled - ${booking_id}`,
        html: `<h2>Appointment Cancelled</h2><p>Dear ${patient?.full_name},</p><p>Your appointment on <strong>${formattedDate} at ${booking.preferred_time}</strong> has been cancelled.</p><p><strong>Treatments:</strong> ${treatmentList}</p><p>If this was a mistake, please contact us.</p>`,
      })

      await resend.emails.send({
        from,
        to: 'ayurshalapanchkarma@gmail.com',
        subject: `Booking Cancelled - ${booking_id} (${patient?.patient_id})`,
        html: `<h3>Booking Cancelled</h3><p>${patient?.full_name} (${patient?.patient_id})</p><p>${formattedDate} · ${booking.preferred_time}</p><p>${treatmentList}</p>`,
      })
    } catch (err) {
      console.error('Email error:', err)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
