import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')

  let query = supabase.from('bookings_new').select('*').eq('is_deleted', false).order('created_at', { ascending: false })
  if (status && status !== 'ALL') query = query.eq('status', status)

  const { data: bookings } = await query
  if (!bookings?.length) return NextResponse.json({ bookings: [] })

  const patientIds = [...new Set(bookings.map(b => b.patient_uuid))]
  const { data: patients } = await supabase.from('patients').select('id,full_name,patient_id,phone').in('id', patientIds)
  const bookingIds = bookings.map(b => b.id)
  const { data: treatments } = await supabase.from('booking_treatments_v2').select('booking_uuid,treatment_name').in('booking_uuid', bookingIds)

  const result = bookings.map(b => {
    const p = patients?.find(p => p.id === b.patient_uuid)
    const t = treatments?.filter(t => t.booking_uuid === b.id).map(t => t.treatment_name).join(', ') || '—'
    return { ...b, patient_name: p?.full_name || '—', patient_id: p?.patient_id || '—', patient_phone: p?.phone || '', treatments: t }
  })

  return NextResponse.json({ bookings: result })
}

export async function POST(req: NextRequest) {
  const { action, booking_id } = await req.json()

  if (action === 'confirm') {
    await supabase.from('bookings_new').update({ status: 'CONFIRMED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    await supabase.from('bookings_new').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
