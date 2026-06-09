import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  
  let query = supabase.from('refunds').select(`
    *,
    booking:booking_uuid(booking_id, preferred_date, preferred_time),
    patient:patient_uuid(full_name, patient_id, email, phone)
  `).order('created_at', { ascending: false })

  if (status && status !== 'ALL') {
    query = query.eq('status', status)
  }

  const { data: refunds, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ refunds: refunds || [] })
}

export async function POST(req: NextRequest) {
  const { action, refund_id, status, cashfree_refund_id } = await req.json()

  if (action === 'create-refund') {
    const { booking_id, reason } = await req.json()
    
    const { data: booking } = await supabase.from('bookings_new')
      .select('id, patient_uuid, booking_id')
      .eq('booking_id', booking_id).single()
    
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: payment } = await supabase.from('payments')
      .select('amount').eq('booking_uuid', booking.id).single()
    
    if (!payment || payment.amount <= 1) {
      return NextResponse.json({ error: 'Only paid bookings can be refunded' }, { status: 400 })
    }

    const { data: newRefund, error } = await supabase.from('refunds').insert({
      booking_uuid: booking.id,
      booking_id: booking.booking_id,
      patient_uuid: booking.patient_uuid,
      amount: payment.amount,
      reason: reason || 'Booking cancelled',
      status: 'PENDING',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ refund: newRefund })
  }

  if (action === 'update-status') {
    const { error } = await supabase.from('refunds').update({
      status,
      cashfree_refund_id,
      processed_at: status === 'PROCESSED' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', refund_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
