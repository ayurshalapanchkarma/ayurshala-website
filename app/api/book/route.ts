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

      const emails: Promise<any>[] = [
        resend.emails.send({
          from,
          to: 'ayurshalapanchkarma@gmail.com',
          subject: `✓ New Appointment: ${name} — ${treatment}`,
          template: 'e6527405-063e-45f0-bb39-df9adb7cf402',
          data: {
            name, phone, email: email || '—', treatment,
            date: date || '—', time: time || '—',
            concern: concern || '—',
            paymentStatus: isPaid ? `✓ Paid ₹${paidAmount} · Order: ${cashfreeOrderId}` : 'Cash on Arrival',
          },
        }),
      ]

      if (email) {
        emails.push(resend.emails.send({
          from,
          to: email,
          subject: `✓ Booking Confirmed — ${treatment} at Ayurshala`,
          template: 'a15c4386-aed6-4efa-8935-5f1ce6f64aa2',
          data: {
            name, treatment,
            date: date || 'To be confirmed', time: time || '—',
            concern: concern || '—',
            amount: isPaid ? `₹${paidAmount} Paid` : 'Pay on arrival',
          },
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
