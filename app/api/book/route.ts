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
        order_amount: Number(amount) || 1,
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
    const paidAmount = Number(amount) || 0
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
      const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
      const logoIcon = 'https://ayurshala-website.vercel.app/ayurshala.png'
      const isPaid = paymentMethod === 'online'
      const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

      // Telegram notification
      const telegramMsg = `🏥 *New Booking — Ayurshala*\n\n👤 *${name}*\n📞 ${phone}${email ? '\n📧 ' + email : ''}\n💆 ${treatment}\n📅 ${date || 'TBD'} ${time ? '· ' + time : ''}\n${concern ? '📝 ' + concern + '\n' : ''}💳 ${isPaid ? `Paid ₹${paidAmount}` : 'Cash on Arrival'}`
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: telegramMsg, parse_mode: 'Markdown' }),
      }).catch(console.error)

      const emails: Promise<any>[] = [
        resend.emails.send({
          from,
          to: 'ayurshalapanchkarma@gmail.com',
          subject: `✓ New Appointment: ${name} — ${treatment}`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#ffffff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="90" style="height:auto;display:block;margin:0 auto 12px"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1a1008">New Appointment Request</h1></td></tr><tr><td style="padding:36px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Name</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${name}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Phone</span><br><span style="font-size:15px;color:#1a1008">${phone}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Email</span><br><span style="font-size:15px;color:#1a1008">${email || '—'}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${treatment}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">'${formattedDate} ${time ? '· ' + time : ''}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Concern</span><br><span style="font-size:15px;color:#1a1008">${concern || '—'}</span></td></tr><tr><td style="padding:14px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Payment</span><br><span style="font-size:15px;color:#1a1008">${isPaid ? `✓ Paid ₹${paidAmount} · Order: ${cashfreeOrderId}` : 'Cash on Arrival'}</span></td></tr></table></td></tr><tr><td style="padding:20px 40px;text-align:center;background:#fffaf5"><img src="${logoIcon}" alt="Ayurshala" width="36" style="height:auto;display:block;margin:0 auto 8px"/><p style="margin:0 0 4px;font-size:12px;color:#78716c">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`,
        }),
      ]

      if (email) {
        emails.push(resend.emails.send({
          from,
          to: email,
          subject: `✓ Booking Confirmed — ${treatment} at Ayurshala`,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#ffffff;border:1px solid rgba(232,98,26,0.18);box-shadow:0 8px 40px rgba(232,98,26,0.10)"><tr><td style="background:linear-gradient(135deg,#fff8f0,#ffe8d0);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)"><img src="${logoText}" alt="Ayurshala" width="90" style="height:auto;display:block;margin:0 auto 12px"/><h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1a1008">Booking Confirmed ✓</h1><p style="margin:0;font-size:13px;color:#a8a29e">Your healing journey begins here</p></td></tr><tr><td style="padding:36px 40px"><p style="margin:0 0 20px;font-size:15px;color:#E8621A">Namaste ${name},</p><p style="margin:0 0 28px;font-size:14px;color:#78716c;line-height:1.7">${isPaid ? 'Your payment has been received and your appointment is confirmed.' : 'Your appointment request has been received.'} We will contact you within 2 hours to confirm your slot.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12);margin-bottom:28px"><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A;font-weight:600">${treatment}</span></td></tr><tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} ${time ? '· ' + time : ''}</span></td></tr>${concern ? `<tr><td style="padding:14px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Your Concern</span><br><span style="font-size:15px;color:#1a1008">${concern}</span></td></tr>` : ''}<tr><td style="padding:14px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Amount</span><br><span style="font-size:15px;color:#1a1008">${isPaid ? `₹${paidAmount} Paid` : 'Pay on arrival'}</span></td></tr></table><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-right:8px"><a href="tel:+919821224767" style="display:block;background:#fff8f0;border:1px solid rgba(232,98,26,0.25);border-radius:12px;padding:14px;text-align:center;font-size:13px;color:#E8621A;text-decoration:none">📞 Call Us<br><span style="font-size:12px;color:#a8a29e">+91-9821224767</span></a></td><td style="padding-left:8px"><a href="https://wa.me/919821224767" style="display:block;background:#f0fff8;border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:14px;text-align:center;font-size:13px;color:#16a34a;text-decoration:none">💬 WhatsApp<br><span style="font-size:12px;color:#a8a29e">Message Us</span></a></td></tr></table></td></tr><tr><td style="padding:20px 40px;text-align:center;background:#fffaf5"><img src="${logoIcon}" alt="Ayurshala" width="36" style="height:auto;display:block;margin:0 auto 8px"/><p style="margin:0 0 4px;font-size:12px;color:#78716c">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center. All Rights Reserved.</p></td></tr></table></td></tr></table></body></html>`,
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
