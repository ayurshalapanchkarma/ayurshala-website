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
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unauthorized</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Access Denied</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">Invalid secret.</p></div></div></body></html>`, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  if (!booking_id)
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Missing Information</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">Booking ID is required.</p></div></div></body></html>`, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking)
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Booking Not Found</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">No booking found with ID <strong>${booking_id}</strong>.</p></div></div></body></html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  if (booking.status !== 'RESCHEDULED') {
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>No Pending Reschedule</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:40px;text-align:center"><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#1a1008">No Pending Reschedule</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">No reschedule to cancel for <strong>${booking_id}</strong>.</p><div style="margin-top:24px"><a href="https://www.ayurshalapanchakarma.com" style="display:inline-block;background:#E8621A;color:#fff;padding:10px 24px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600">Go to Website</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Reject reschedule: set status to RESCHEDULE_REJECTED and mark as rescheduled (no further reschedule attempts)
  await supabase.from('bookings_new').update({
    status: 'RESCHEDULE_REJECTED',
    is_rescheduled: true,
    old_date: null,
    old_time: null,
    new_date: null,
    new_time: null,
    rescheduled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('booking_id', booking_id)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

  if (patient?.email) {
    const html = buildCancelRescheduleEmail({ patient, booking, formattedDate })
    await resend.emails.send({ from, to: patient.email, subject: `Reschedule Request Declined — ${booking_id}`, html })
  }

  return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reschedule Cancelled</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><div style="width:64px;height:64px;background:rgba(220,38,38,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:28px">✕</div><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;display:block;margin:0 auto 16px"/><h1 style="margin:0;font-family:Georgia,serif;font-size:24px;color:#991b1b">Reschedule Declined</h1><p style="margin:8px 0 0;font-size:13px;color:#6b7280">Patient notified of cancellation</p></div><div style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:14px;border:1px solid rgba(220,38,38,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#dc2626">${booking_id}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Original Appointment</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr></table><div style="margin-top:24px"><a href="https://www.ayurshalapanchakarma.com" style="display:inline-block;background:#E8621A;color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600">Go to Website</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function buildCancelRescheduleEmail({ patient, booking, formattedDate }: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(220,38,38,0.18);box-shadow:0 8px 40px rgba(220,38,38,0.10)"><tr><td style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(220,38,38,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#991b1b">Reschedule Request Declined</h1></td></tr><tr><td style="padding:32px 40px"><p style="font-size:13px;color:#78716c;margin:0 0 20px">Your reschedule request has been declined. Your original appointment remains valid. If you are unable to attend, please cancel this booking and create a new appointment.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:14px;border:1px solid rgba(220,38,38,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(220,38,38,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#1a1008">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Original Appointment</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${formattedDate} · ${booking.preferred_time}</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">For questions, contact Ayurshala: <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr><tr style="background:#fffaf5"><td style="padding:16px 40px;text-align:center"><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}
