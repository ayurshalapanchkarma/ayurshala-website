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
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unauthorized</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Access Denied</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">Invalid secret. Please check your link.</p></div></div></body></html>`, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  if (!booking_id)
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Missing Information</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">Booking ID is required.</p></div></div></body></html>`, { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking) return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not Found</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Booking Not Found</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">No booking found with ID <strong>${booking_id}</strong>.</p></div></div></body></html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  
  // Validate booking status - treat RESCHEDULED as pending approval
  if (booking.status === 'CANCELLED') {
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cannot Confirm</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#fee2e2,#fecaca);padding:40px;text-align:center"><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#991b1b">Cannot Confirm</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">This booking was cancelled. Reschedule confirmation is not possible.</p><div style="margin-top:24px"><a href="https://www.ayurshalapanchakarma.com" style="display:inline-block;background:#E8621A;color:#fff;padding:10px 24px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600">Go to Website</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (booking.status === 'CONFIRMED') {
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Already Confirmed</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center"><div style="max-width:480px;width:90%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);padding:40px;text-align:center"><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#166534">Already Confirmed</h1><p style="margin:12px 0 0;font-size:13px;color:#a8a29e">This booking is already confirmed. No action needed.</p><div style="margin-top:24px"><a href="https://www.ayurshalapanchakarma.com" style="display:inline-block;background:#E8621A;color:#fff;padding:10px 24px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600">Go to Website</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  if (booking.status !== 'RESCHEDULED') {
    const statusText = booking.status === 'RESCHEDULE_REJECTED' 
      ? 'Reschedule Request Declined'
      : booking.status === 'CONFIRMED'
      ? 'Reschedule Request Processed'
      : 'No Pending Reschedule'
    
    const descText = booking.status === 'RESCHEDULE_REJECTED'
      ? "The reschedule request for this booking has already been declined. The patient's original appointment remains active and unchanged."
      : booking.status === 'CONFIRMED'
      ? "This request has already been reviewed by an administrator. No further action is required."
      : "This booking does not currently have any reschedule requests awaiting approval."
    
    const iconColor = booking.status === 'RESCHEDULE_REJECTED' ? '#dc2626' : booking.status === 'CONFIRMED' ? '#16a34a' : '#78716c'
    const bgGradient = booking.status === 'RESCHEDULE_REJECTED' ? 'linear-gradient(135deg,#fee2e2,#fecaca)' : booking.status === 'CONFIRMED' ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg,#fff8f0,#ffe8d0)'
    
    return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${statusText}</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px"><div style="max-width:480px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:${bgGradient};padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:${iconColor}">${statusText}</h1></div><div style="padding:32px 40px"><p style="font-size:13px;color:#78716c;margin:0 0 24px">${descText}</p><div style="display:flex;gap:12px;margin-top:24px"><a href="https://www.ayurshalapanchakarma.com/admin" style="flex:1;display:inline-block;background:#E8621A;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;text-align:center">Back to Dashboard</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Update booking: approve reschedule by moving new date/time to preferred, mark as rescheduled
  await supabase.from('bookings_new').update({
    status: 'RESCHEDULED',
    preferred_date: booking.new_date,
    preferred_time: booking.new_time,
    is_rescheduled: true,
    rescheduled_at: new Date().toISOString(),
    old_date: null,
    old_time: null,
    new_date: null,
    new_time: null,
    updated_at: new Date().toISOString()
  }).eq('booking_id', booking_id)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
  const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'

  const oldDate = new Date(booking.old_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
  const newDateFmt = new Date(booking.new_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

  if (patient?.email) {
    await resend.emails.send({
      from, to: patient.email,
      subject: `Reschedule Approved — ${booking_id}`,
      html: buildPatientRescheduleApprovedEmail({ patient, booking, treatmentList, oldDate, newDateFmt }),
    })
  }

  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, parse_mode: 'Markdown', text: `*Reschedule Approved — Ayurshala*\n\n*${patient?.full_name}*\n${booking_id}\n${treatmentList}\nNew: ${booking.new_date} · ${booking.new_time}` }),
  }).catch(() => {})

  return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reschedule Confirmed</title></head><body style="margin:0;padding:0;background:linear-gradient(135deg,#fdf6ee,#ffecd2);font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px"><div style="max-width:480px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(232,98,26,0.12);border:1px solid rgba(232,98,26,0.2)"><div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(16,185,129,0.15)"><img src="https://ayurshala-website.vercel.app/ayurshala_text.png" alt="Ayurshala" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#16a34a">Reschedule Confirmed!</h1><p style="margin:8px 0 0;font-size:13px;color:#6b7280">Confirmation email sent to patient</p></div><div style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:14px;border:1px solid rgba(16,185,129,0.12);margin-bottom:24px"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#E8621A">${booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">New Appointment</span><br><span style="font-size:15px;color:#16a34a;font-weight:600">${newDateFmt} · ${booking.new_time}</span></td></tr></table><div style="display:flex;gap:12px;margin-top:24px"><a href="https://www.ayurshalapanchakarma.com/admin" style="flex:1;display:inline-block;background:#E8621A;color:#fff;padding:12px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;text-align:center">Back to Dashboard</a></div></div></div></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function buildPatientRescheduleApprovedEmail({ patient, booking, treatmentList, oldDate, newDateFmt }: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(16,185,129,0.18);box-shadow:0 8px 40px rgba(16,185,129,0.10)"><tr><td style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(16,185,129,0.15)"><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#166534">Reschedule Approved</h1></td></tr><tr><td style="padding:32px 40px"><p style="font-size:13px;color:#78716c;margin:0 0 20px">Your reschedule request has been approved! Your appointment is now confirmed for the new date and time.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:14px;border:1px solid rgba(16,185,129,0.12);margin-bottom:20px"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(16,185,129,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Previous Appointment</span><br><span style="font-size:15px;color:#9ca3af;text-decoration:line-through">${oldDate} · ${booking.old_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">New Appointment</span><br><span style="font-size:15px;color:#16a34a;font-weight:600">${newDateFmt} · ${booking.new_time}</span></td></tr></table><p style="text-align:center;font-size:12px;color:#c4bdb5;margin:0">Questions? Call +91-9821224767</p></td></tr><tr style="background:#fffaf5"><td style="padding:16px 40px;text-align:center"><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  const { booking_id } = await req.json()
  if (!booking_id) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', booking_id).single()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'RESCHEDULED') return NextResponse.json({ error: 'No pending reschedule' }, { status: 400 })

  await supabase.from('bookings_new').update({
    status: 'RESCHEDULED',
    preferred_date: booking.new_date,
    preferred_time: booking.new_time,
    is_rescheduled: true,
    rescheduled_at: new Date().toISOString(),
    old_date: null,
    old_time: null,
    new_date: null,
    new_time: null,
    updated_at: new Date().toISOString()
  }).eq('booking_id', booking_id)

  const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
  const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
  const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
  const oldDate = new Date(booking.old_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })
  const newDateFmt = new Date(booking.new_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

  if (patient?.email) {
    await resend.emails.send({
      from, to: patient.email,
      subject: `Reschedule Approved — ${booking_id}`,
      html: buildPatientRescheduleApprovedEmail({ patient, booking, treatmentList, oldDate, newDateFmt }),
    })
  }

  return NextResponse.json({ success: true })
}
