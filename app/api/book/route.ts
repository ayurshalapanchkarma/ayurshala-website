import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'create-order') {
    const { patient_uuid, patient_id, treatments, preferred_date, preferred_time, concern, booking_type } = body
    const amount = booking_type === 'consultation' ? 500 : 1000

    // Duplicate check
    const { data: existing } = await supabase.from('bookings_v2')
      .select('id').eq('patient_uuid', patient_uuid)
      .eq('preferred_date', preferred_date).eq('preferred_time', preferred_time)
      .neq('status', 'CANCELLED').single()
    if (existing) return NextResponse.json({ error: 'You already have a booking for this time slot.' }, { status: 409 })

    // Create booking
    const { data: booking, error: bookingErr } = await supabase.from('bookings_v2').insert({
      patient_uuid, patient_id, booking_type,
      preferred_date, preferred_time, concern: concern || '',
      status: 'PAYMENT_PENDING', payment_status: 'PENDING',
    }).select().single()
    if (bookingErr) return NextResponse.json({ error: bookingErr.message }, { status: 500 })

    // Insert treatments
    await supabase.from('booking_treatments').insert(
      treatments.map((t: string) => ({ booking_uuid: booking.id, treatment_name: t }))
    )

    // Create Cashfree order
    const cashfree = new Cashfree(
      CFEnvironment.PRODUCTION,
      process.env.CASHFREE_APP_ID,
      process.env.CASHFREE_SECRET_KEY,
    )
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', patient_uuid).single()
    const cashfreeOrder = await cashfree.PGCreateOrder({
      order_id: booking.booking_id,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: patientData.patient_id,
        customer_name: patientData.full_name || 'Patient',
        customer_email: patientData.email,
        customer_phone: (patientData.phone || '9999999999').replace(/\D/g, '').slice(-10),
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/book/verify?order_id={order_id}`,
      },
      order_note: `${booking_type === 'consultation' ? 'Consultation' : treatments.join(', ')} | ${preferred_date} ${preferred_time}`,
    })

    // Create payment record
    await supabase.from('payments').insert({
      booking_uuid: booking.id, patient_uuid,
      cashfree_order_id: booking.booking_id,
      amount, status: 'PENDING',
    })

    return NextResponse.json({ bookingId: booking.booking_id, paymentSessionId: cashfreeOrder.data.payment_session_id })
  }

  if (action === 'confirm-booking') {
    const { booking_id, cashfree_order_id, transaction_id } = body

    const { data: booking } = await supabase.from('bookings_v2').select('*, patients(*)').eq('booking_id', booking_id).single()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Update booking + payment
    await supabase.from('bookings_v2').update({ status: 'CONFIRMED', payment_status: 'SUCCESS' }).eq('booking_id', booking_id)
    await supabase.from('payments').update({ status: 'SUCCESS', transaction_id: transaction_id || '' }).eq('cashfree_order_id', cashfree_order_id)

    // Get treatments
    const { data: treatmentRows } = await supabase.from('booking_treatments').select('treatment_name').eq('booking_uuid', booking.id)
    const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
    const patient = booking.patients as any
    const amount = booking.booking_type === 'consultation' ? 500 : 1000

    // Telegram
    const telegramMsg = `🏥 *Booking Confirmed — Ayurshala*\n\n👤 *${patient.full_name}*\n🆔 ${patient.patient_id}\n📋 ${booking.booking_id}\n📞 ${patient.phone || '—'}\n📧 ${patient.email}\n💆 ${treatmentList}\n📅 ${booking.preferred_date} · ${booking.preferred_time}\n💳 Paid ₹${amount}`
    fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: 'Markdown' }),
    }).catch(console.error)

    const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
    const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
    const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
    const formattedDate = booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

    const emailHtml = (toClinic: boolean) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="90" style="height:auto;display:block;margin:0 auto 12px"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1008">${toClinic ? 'New Booking Confirmed' : 'Booking Confirmed ✓'}</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient ID</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${patient.patient_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#1a1008">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Amount Paid</span><br><span style="font-size:15px;color:#1a1008">₹${amount}</span></td></tr></table></td></tr><tr><td style="padding:20px 40px;text-align:center;background:#fffaf5"><img src="${logoIcon}" alt="" width="32" style="height:auto;display:block;margin:0 auto 8px"/><p style="margin:0 0 4px;font-size:12px;color:#78716c">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`

    const emails = [resend.emails.send({ from, to: 'ayurshalapanchkarma@gmail.com', subject: `✓ ${booking.booking_id} — ${patient.full_name}`, html: emailHtml(true) })]
    if (patient.email) emails.push(resend.emails.send({ from, to: patient.email, subject: `✓ Booking Confirmed — ${booking.booking_id}`, html: emailHtml(false) }))
    await Promise.all(emails)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
