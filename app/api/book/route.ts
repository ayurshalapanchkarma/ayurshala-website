import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const isSandbox = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'sandbox'

const cashfree = new Cashfree(
  isSandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
  isSandbox ? process.env.CASHFREE_SANDBOX_APP_ID : process.env.CASHFREE_APP_ID,
  isSandbox ? process.env.CASHFREE_SANDBOX_SECRET_KEY : process.env.CASHFREE_SECRET_KEY,
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email, treatment, date, time, concern, action, amount } = body

  if (action === 'create-order') {
    if (!name || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    try {
      const orderId = `booking_${Date.now()}`

      // Save booking to Supabase before redirecting to payment
      await supabase.from('bookings').insert({
        name, email: email || '', phone, treatment,
        date: date || '', time: time || '', concern: concern || '',
        paymentmethod: 'online', paymentid: orderId, status: 'pending',
      })

      const response = await cashfree.PGCreateOrder({
        order_id: orderId,
        order_amount: Math.max(500, Number(amount) || 500),
        order_currency: 'INR',
        customer_details: {
          customer_id: phone.replace(/\D/g, '').slice(-10),
          customer_name: name,
          customer_email: email || 'noemail@ayurshala.com',
          customer_phone: phone.replace(/\D/g, '').slice(-10),
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/book/verify?order_id={order_id}`,
        },
        order_note: `${treatment} | ${date || 'TBD'} ${time || ''}`,
      })
      return NextResponse.json({
        orderId,
        paymentSessionId: response.data.payment_session_id,
      })
    } catch (err: any) {
      console.error(err?.response?.data || err)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
  }

  if (action === 'confirm-booking') {
    const { cashfreeOrderId, paymentMethod } = body
    const paidAmount = Math.max(500, Number(amount) || 500)
    if (Number(amount) > 0 && Number(amount) < 500) {
      return NextResponse.json({ error: 'Amount must be at least ₹500' }, { status: 400 })
    }
    if (!name || !phone || !treatment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const { error: dbError } = await supabase.from('bookings').insert({
        name, email: email || '', phone, treatment,
        date: date || '', time: time || '', concern: concern || '',
        paymentmethod: paymentMethod, paymentid: cashfreeOrderId || '', status: 'pending',
      })
      if (dbError) console.error('Database error:', dbError)

      const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
      const isPaid = paymentMethod === 'online'

      // Telegram notification
      const telegramMsg = `🏥 *New Booking — Ayurshala*\n\n👤 *${name}*\n📞 ${phone}${email ? '\n📧 ' + email : ''}\n💆 ${treatment}\n📅 ${date || 'TBD'} ${time ? '· ' + time : ''}\n${concern ? '📝 ' + concern + '\n' : ''}💳 ${isPaid ? `Paid ₹${paidAmount}` : 'Cash on Arrival'}`
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: 'Markdown' }),
      }).catch(console.error)

      const adminHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d1f16;border-radius:16px;overflow:hidden;max-width:600px">
  <tr><td style="background:linear-gradient(135deg,#1a3a22,#0d1f16);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.3)">
    <img src="https://ayurshalapanchakarma.com/ayurshala_text_transparent.png" alt="Ayurshala" width="200" style="max-width:200px;height:auto;margin-bottom:8px" />
    <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#f5f0e8">New Appointment Request</h1>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Name</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8;font-weight:600">${name}</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Phone</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8">${phone}</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Email</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8">${email || '—'}</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Treatment</span><br><span style="font-family:sans-serif;font-size:15px;color:#c9a84c;font-weight:600">${treatment}</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Date &amp; Time</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8">${date || '—'} ${time ? '· ' + time : ''}</span></td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Concern</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8">${concern || '—'}</span></td></tr>
      <tr><td style="padding:10px 0"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Payment</span><br><span style="font-family:sans-serif;font-size:15px;color:${isPaid ? '#4ade80' : '#f5f0e8'}">${isPaid ? `✓ Paid ₹${paidAmount} · Order: ${cashfreeOrderId}` : 'Cash on Arrival'}</span></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 40px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="margin:0;font-family:sans-serif;font-size:11px;color:#555">ayurshalapanchakarma.com · SP-28, Wajidpur, Sector-130, Noida</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

      const patientHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0d1f16;border-radius:16px;overflow:hidden;max-width:600px">
  <tr><td style="background:linear-gradient(135deg,#1a3a22,#0d1f16);padding:40px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.3)">
    <img src="https://ayurshalapanchakarma.com/ayurshala_text_transparent.png" alt="Ayurshala" width="200" style="max-width:200px;height:auto;margin-bottom:8px" />
    <h1 style="margin:8px 0 4px;font-family:Georgia,serif;font-size:28px;color:#f5f0e8">Booking Confirmed ✓</h1>
    <p style="margin:0;font-family:sans-serif;font-size:14px;color:#a0a0a0">Your healing journey begins here</p>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <p style="font-family:sans-serif;font-size:15px;color:#c9a84c;margin:0 0 24px">Namaste ${name},</p>
    <p style="font-family:sans-serif;font-size:14px;color:#a0a0a0;line-height:1.6;margin:0 0 28px">${isPaid ? 'Your payment has been received and your appointment is confirmed.' : 'Your appointment request has been received.'} We will contact you within 2 hours to confirm your slot.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden">
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Treatment</span><br><span style="font-family:sans-serif;font-size:15px;color:#c9a84c;font-weight:600">${treatment}</span></td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Date &amp; Time</span><br><span style="font-family:sans-serif;font-size:15px;color:#f5f0e8">${date || 'To be confirmed'} ${time ? '· ' + time : ''}</span></td></tr>
      ${concern ? `<tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Your Concern</span><br><span style="font-family:sans-serif;font-size:14px;color:#a0a0a0">${concern}</span></td></tr>` : ''}
      <tr><td style="padding:16px 20px"><span style="font-family:sans-serif;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px">Amount</span><br><span style="font-family:sans-serif;font-size:15px;color:${isPaid ? '#4ade80' : '#f5f0e8'}">${isPaid ? `₹${paidAmount} Paid` : 'Pay on arrival'}</span></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px">
      <tr>
        <td style="padding:0 8px 0 0"><a href="tel:+919821224767" style="display:block;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);border-radius:10px;padding:14px;text-align:center;font-family:sans-serif;font-size:13px;color:#c9a84c;text-decoration:none">📞 Call Us<br><span style="font-size:12px;color:#888">+91-9821224767</span></a></td>
        <td style="padding:0 0 0 8px"><a href="https://wa.me/919821224767" style="display:block;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:14px;text-align:center;font-family:sans-serif;font-size:13px;color:#4ade80;text-decoration:none">💬 WhatsApp<br><span style="font-size:12px;color:#888">Message Us</span></a></td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="margin:0 0 4px;font-family:sans-serif;font-size:12px;color:#555">SP-28, Wajidpur, Sector-130, Noida — 201301</p>
    <p style="margin:0;font-family:sans-serif;font-size:11px;color:#444">ayurshalapanchakarma.com</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

      const adminEmail = resend.emails.send({
        from,
        to: 'ayurshalapanchkarma@gmail.com',
        subject: `✓ New Appointment: ${name} — ${treatment}`,
        html: adminHtml,
      })

      const emails = [adminEmail]

      if (email) {
        emails.push(resend.emails.send({
          from,
          to: email,
          subject: `✓ Booking Confirmed — ${treatment} at Ayurshala`,
          html: patientHtml,
        }))
      }

      await Promise.all(emails)
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error(err)
      return NextResponse.json({ error: 'Failed to send confirmation' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
