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
  
  // Strict booking state validation
  if (booking.status === 'CANCELLED') {
    return new NextResponse('This booking has been cancelled and cannot be confirmed. Please create or approve a rescheduled appointment.', { status: 409 })
  }
  if (booking.status === 'CONFIRMED') {
    return new NextResponse('This booking has already been confirmed.', { status: 409 })
  }

  await supabase.from('bookings_new').update({ status: 'CONFIRMED', updated_at: new Date().toISOString() }).eq('booking_id', booking_id)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
  const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
  const { data: paymentData } = await supabase.from('payments').select('amount').eq('booking_id', booking.booking_id).single()
  const actualAmount = paymentData?.amount || (booking.booking_type === 'consultation' ? 500 : 1000)
  const amountLabel = `₹${actualAmount} — Cash on Arrival`
  const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

  // Send confirmation email to patient
  if (patient?.email) {
    const html = buildConfirmedEmail({ patient, booking, treatmentList, formattedDate, amountLabel })
    await resend.emails.send({ from, to: patient.email, subject: `Booking Confirmed — ${booking_id}`, html })
  }

  // Telegram notification
  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, parse_mode: 'Markdown', text: `*Booking Confirmed — Ayurshala*\n\n*${patient?.full_name}*\n${patient?.patient_id}\n${booking_id}\n${patient?.phone || '—'}\n${treatmentList}\n${booking.preferred_date} · ${booking.preferred_time}` }),
  }).catch(() => {})

  return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Booking Confirmed</title></head><body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(22,163,74,0.12);border:1px solid rgba(22,163,74,0.2)"><div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(22,163,74,0.15)"><div style="width:64px;height:64px;background:rgba(22,163,74,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:28px">✓</div><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;display:block;margin:0 auto 16px"/><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;color:#15803d">Booking Confirmed!</h1><p style="margin:8px 0 0;font-size:13px;color:#6b7280">Confirmation email sent to patient</p></div><div style="padding:28px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;border:1px solid #e5e7eb"><tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Patient</span><br><span style="font-size:15px;color:#111827;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Booking ID</span><br><span style="font-size:15px;color:#E8621A">${booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid #f3f4f6"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af">Date &amp; Time</span><br><span style="font-size:15px;color:#111827">${formattedDate} · ${booking.preferred_time}</span></td></tr></table></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function buildConfirmedEmail({ patient, booking, treatmentList, formattedDate, amountLabel }: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1008">✓ Booking Confirmed</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${patient.patient_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#1a1008">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Payment</span><br><span style="font-size:15px;color:#1a1008">${amountLabel}</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">We look forward to seeing you. Please arrive 10 minutes early.<br>Questions? Call <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr><tr><td style="padding:20px 40px;text-align:center;background:#fffaf5"><p style="margin:0 0 4px;font-size:12px;color:#78716c">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}
