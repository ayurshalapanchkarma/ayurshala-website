import Razorpay from 'razorpay'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

let razorpay: any = null
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, email, treatment, date, time, concern, action } = body

  if (action === 'create-order') {
    // Create Razorpay order
    if (!razorpay) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
    }
    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const order = await razorpay.orders.create({
        amount: 50000, // ₹500 in paise (₹1 = 100 paise)
        currency: 'INR',
        receipt: `booking_${Date.now()}`,
        notes: {
          name,
          phone,
          email,
          treatment,
          date: date || 'TBD',
          time: time || 'TBD',
          concern: concern || '',
        },
      })
      return NextResponse.json({ orderId: order.id, amount: order.amount })
    } catch (err) {
      console.error(err)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
  }

  if (action === 'confirm-booking') {
    // Send confirmation emails for both online and COD
    const { razorpayPaymentId, razorpayOrderId, paymentMethod } = body

    if (!name || !phone || !treatment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    try {
      const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'
      const isPaid = paymentMethod === 'online'
      const amount = '₹500'
      
      let paymentDetails: any = {}
      if (isPaid && razorpayPaymentId && razorpay) {
        try {
          const payment = await razorpay.payments.fetch(razorpayPaymentId)
          paymentDetails = {
            transactionId: payment.id,
            method: payment.method,
            bank: payment.bank || payment.acquirer_data?.bank_account?.bank_name || 'N/A',
            vpa: payment.vpa || 'N/A',
            createdAt: new Date(payment.created_at * 1000).toLocaleString('en-IN'),
            status: payment.status,
          }
        } catch (err) {
          console.error('Failed to fetch payment details:', err)
        }
      }

      const adminEmail = resend.emails.send({
        from,
        to: 'ayurshalapanchkarma@gmail.com',
        subject: `✓ New Appointment: ${name} — ${treatment}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d1f16;color:#f5f0e8;padding:32px;border-radius:12px">
            <h2 style="color:#c9a84c;margin-bottom:24px">✓ New Appointment Request</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#a0a0a0;width:140px">Name</td><td style="padding:8px 0;font-weight:500">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Phone</td><td style="padding:8px 0">${phone}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Email</td><td style="padding:8px 0">${email || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Treatment</td><td style="padding:8px 0;color:#c9a84c">${treatment}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Preferred Date</td><td style="padding:8px 0">${date || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Preferred Time</td><td style="padding:8px 0">${time || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0;vertical-align:top">Concern</td><td style="padding:8px 0">${concern || '—'}</td></tr>
              <tr style="border-top:1px solid rgba(201,168,76,0.2);"><td style="padding:8px 0;color:#a0a0a0;padding-top:16px">Amount</td><td style="padding:8px 0;padding-top:16px;color:#c9a84c">${amount}</td></tr>
              <tr><td style="padding:8px 0;color:#a0a0a0">Payment</td><td style="padding:8px 0">${isPaid ? `✓ Paid` : 'COD'}</td></tr>
              ${isPaid && paymentDetails.transactionId ? `
                <tr><td style="padding:8px 0;color:#a0a0a0">Transaction ID</td><td style="padding:8px 0;font-size:11px;color:#999">${paymentDetails.transactionId}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Payment Method</td><td style="padding:8px 0;text-transform:capitalize">${paymentDetails.method}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Bank/UPI</td><td style="padding:8px 0">${paymentDetails.vpa !== 'N/A' ? paymentDetails.vpa : paymentDetails.bank}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Payment Date/Time</td><td style="padding:8px 0;font-size:11px">${paymentDetails.createdAt}</td></tr>
              ` : ''}
            </table>
            <p style="margin-top:24px;font-size:12px;color:#666">Sent from ayurshalapanchakarma.com</p>
          </div>
        `,
      })

      const emails = [adminEmail]

      if (email) {
        emails.push(resend.emails.send({
          from,
          to: email,
          subject: `✓ Booking Confirmed — ${treatment} at Ayurshala`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d1f16;color:#f5f0e8;padding:32px;border-radius:12px">
              <h2 style="color:#c9a84c;margin-bottom:8px">✓ Your Appointment is Confirmed!</h2>
              <p style="color:#a0a0a0;margin-bottom:24px">Hi ${name}, ${isPaid ? 'payment received.' : 'your booking is confirmed.'} We'll reach out within 2 hours to confirm your slot.</p>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#a0a0a0;width:140px">Treatment</td><td style="padding:8px 0;color:#c9a84c">${treatment}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Preferred Date</td><td style="padding:8px 0">${date || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Preferred Time</td><td style="padding:8px 0">${time || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0;vertical-align:top">Your Concern</td><td style="padding:8px 0">${concern || '—'}</td></tr>
                <tr style="border-top:1px solid rgba(201,168,76,0.2);"><td style="padding:8px 0;color:#a0a0a0;padding-top:16px">Amount</td><td style="padding:8px 0;padding-top:16px;color:#c9a84c;font-weight:500">${amount}</td></tr>
                <tr><td style="padding:8px 0;color:#a0a0a0">Payment</td><td style="padding:8px 0">${isPaid ? `✓ Paid` : 'Pay on arrival'}</td></tr>
                ${isPaid && paymentDetails.transactionId ? `
                  <tr><td style="padding:8px 0;color:#a0a0a0">Transaction ID</td><td style="padding:8px 0;font-size:11px;color:#999">${paymentDetails.transactionId}</td></tr>
                  <tr><td style="padding:8px 0;color:#a0a0a0">Payment Method</td><td style="padding:8px 0;text-transform:capitalize">${paymentDetails.method}</td></tr>
                  <tr><td style="padding:8px 0;color:#a0a0a0">Bank/UPI</td><td style="padding:8px 0">${paymentDetails.vpa !== 'N/A' ? paymentDetails.vpa : paymentDetails.bank}</td></tr>
                  <tr><td style="padding:8px 0;color:#a0a0a0">Payment Date/Time</td><td style="padding:8px 0;font-size:11px">${paymentDetails.createdAt}</td></tr>
                ` : ''}
              </table>
              <p style="margin-top:24px;color:#a0a0a0">Need to reschedule or have questions? Call or WhatsApp us at <a href="tel:+919821224767" style="color:#c9a84c">+91-9821224767</a>.</p>
              <p style="margin-top:24px;font-size:12px;color:#666">Ayurshala Panchakarma · ayurshalapanchakarma.com</p>
            </div>
          `,
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
