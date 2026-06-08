import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const booking_id = req.nextUrl.searchParams.get('booking_id')
  const secret = req.nextUrl.searchParams.get('secret')

  if (secret !== (process.env.ADMIN_CONFIRM_SECRET ?? 'ayurshala-confirm'))
    return new NextResponse('Unauthorized', { status: 401 })
  if (!booking_id)
    return new NextResponse('Missing booking_id', { status: 400 })

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking) return new NextResponse('Booking not found', { status: 404 })
  if (!booking.is_rescheduled) return new NextResponse(`<html><body style="font-family:Arial;text-align:center;padding:60px"><h2>No pending reschedule</h2></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } })

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
  const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'

  const oldDate = new Date(booking.old_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
  const newDateFmt = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

  if (patient?.email) {
    await resend.emails.send({
      from, to: patient.email,
      subject: `✓ Reschedule Confirmed — ${booking_id}`,
      html: buildPatientRescheduleEmail({ patient, booking, treatmentList, oldDate, newDateFmt }),
    })
  }

  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, parse_mode: 'Markdown', text: `✅ *Reschedule Confirmed — Ayurshala*\n\n👤 *${patient?.full_name}*\n📋 ${booking_id}\n💆 ${treatmentList}\n📅 New: ${booking.preferred_date} · ${booking.preferred_time}` }),
  }).catch(() => {})

  return new NextResponse(`<html><body style="font-family:Arial;text-align:center;padding:60px;background:#f0fdf4"><h2 style="color:#16a34a">✓ Reschedule Confirmed!</h2><p style="color:#555">${booking_id} — ${patient?.full_name}</p><p style="color:#555">New appointment: ${newDateFmt} · ${booking.preferred_time}</p><p style="color:#555">Confirmation email sent to patient.</p></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } })
}

function buildPatientRescheduleEmail({ patient, booking, treatmentList, oldDate, newDateFmt }: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1008">✓ Reschedule Confirmed</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#E8621A">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Previous Appointment</span><br><span style="font-size:15px;color:#78716c;text-decoration:line-through">${oldDate} · ${booking.old_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">New Appointment</span><br><span style="font-size:15px;color:#16a34a;font-weight:600">${newDateFmt} · ${booking.preferred_time}</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">Please arrive 10 minutes early.<br>Questions? Call <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr></table></td></tr></table></body></html>`
}
