import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const booking_id = req.nextUrl.searchParams.get('booking_id')
  const secret = req.nextUrl.searchParams.get('secret')

  if (!booking_id || secret !== (process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    await supabase.from('bookings_new').update({ status: 'CANCELLED' }).eq('booking_id', booking_id)

    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(220,38,38,0.15);box-shadow:0 8px 40px rgba(220,38,38,0.10)"><tr><td style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(220,38,38,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#991b1b">Booking Cancelled</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:14px;border:1px solid rgba(220,38,38,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#dc2626;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Status</span><br><span style="font-size:15px;color:#dc2626;font-weight:600">Cancelled</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">Your booking has been cancelled by Ayurshala.<br>For queries, call <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr></table></td></tr></table></body></html>`

    if (patient.email) {
      await resend.emails.send({ from, to: patient.email, subject: `Booking Cancelled — ${booking_id}`, html })
    }

    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking Cancelled</title></head><body style="margin:0;padding:0;background:#fee2e2;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(220,38,38,0.12);border:1px solid rgba(220,38,38,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(220,38,38,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;color:#991b1b">Cancelled</h1><p style="margin:8px 0 0;font-size:13px;color:#a8a29e">Booking ${booking_id} has been cancelled.</p></div><div style="padding:32px 40px;text-align:center"><p style="font-size:13px;color:#78716c;margin:0">Patient ${patient.full_name} has been notified via email.</p></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json()
    if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

    const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    await supabase.from('bookings_new').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(220,38,38,0.15);box-shadow:0 8px 40px rgba(220,38,38,0.10)"><tr><td style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(220,38,38,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#991b1b">Booking Cancelled</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:14px;border:1px solid rgba(220,38,38,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#dc2626;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#1a1008">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Status</span><br><span style="font-size:15px;color:#dc2626;font-weight:600">Cancelled</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">Your booking has been cancelled by Ayurshala.<br>For queries, call <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr></table></td></tr></table></body></html>`

    if (patient.email) {
      await resend.emails.send({ from, to: patient.email, subject: `Booking Cancelled — ${booking_id}`, html })
    }

    return NextResponse.json({ success: true, message: 'Booking cancelled' })
  } catch (error) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
