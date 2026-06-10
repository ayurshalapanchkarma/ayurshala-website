import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  const originalBookingId = req.nextUrl.searchParams.get('original_booking_id')
  
  console.log(`[PAYMENT_VERIFY] Start - orderId: ${orderId}, originalBookingId: ${originalBookingId}`)
  
  if (!orderId) {
    console.error('[PAYMENT_VERIFY] No order_id provided')
    return NextResponse.redirect(new URL('/book?status=error', req.url))
  }

  try {
    const cashfree = new Cashfree(CFEnvironment.PRODUCTION, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)
    const response = await cashfree.PGOrderFetchPayments(orderId)
    const payment = response.data?.[0]
    const success = payment?.payment_status === 'SUCCESS'
    const cancelled = payment?.payment_status === 'USER_DROPPED' || payment?.payment_status === 'CANCELLED'

    console.log(`[PAYMENT_VERIFY] Payment status: ${payment?.payment_status}, Amount: ${payment?.order_amount}`)

    if (cancelled) {
      console.log(`[PAYMENT_VERIFY] Payment cancelled by user`)
      return NextResponse.redirect(new URL(`/book/payment-cancelled?order_id=${orderId}`, req.url))
    }
    if (!success) {
      console.log(`[PAYMENT_VERIFY] Payment failed`)
      return NextResponse.redirect(new URL(`/book/payment-failed?order_id=${orderId}`, req.url))
    }

    console.log(`[PAYMENT_VERIFY] Payment successful - proceeding with booking confirmation`)

    // Payment for existing booking (reschedule pay-online flow)
    if (originalBookingId) {
      const { data: booking } = await supabase.from('bookings_new').select('*').eq('booking_id', originalBookingId).single()
      if (booking) {
        console.log(`[PAYMENT_VERIFY] Updating existing booking: ${originalBookingId}`)
        
        await supabase.from('bookings_new').update({
          status: 'CONFIRMED', payment_status: 'SUCCESS', payment_method: 'ONLINE', updated_at: new Date().toISOString(),
        }).eq('booking_id', originalBookingId)

        await supabase.from('payments').update({
          status: 'SUCCESS', transaction_id: payment?.cf_payment_id || '', paid_at: new Date().toISOString(),
        }).eq('cashfree_order_id', booking.booking_id)

        console.log(`[PAYMENT_VERIFY] Booking updated: status=CONFIRMED, payment_status=SUCCESS`)

        const { data: patient } = await supabase.from('patients').select('*').eq('id', booking.patient_uuid).single()
        const { data: treatmentRows } = await supabase.from('booking_treatments_v2').select('treatment_name').eq('booking_uuid', booking.id)
        const treatmentList = treatmentRows?.map((t: any) => t.treatment_name).join(', ') || '—'
        const formattedDate = new Date(booking.preferred_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
        const { data: paymentData } = await supabase.from('payments').select('amount').eq('booking_uuid', booking.id).single()
        const actualAmount = paymentData?.amount || (booking.booking_type === 'consultation' ? 500 : 1000)
        const amountLabel = `₹${actualAmount} — Paid Online`
        const from = process.env.RESEND_FROM_EMAIL ?? 'Ayurshala Bookings <onboarding@resend.dev>'

        if (patient?.email) {
          await resend.emails.send({
            from, to: patient.email,
            subject: `Payment Received & Booking Confirmed — ${originalBookingId}`,
            html: buildPaymentConfirmedEmail({ patient, booking, treatmentList, formattedDate, amountLabel }),
          })
        }

        await resend.emails.send({
          from, to: 'ayurshalapanchkarma@gmail.com',
          subject: `${originalBookingId} — ${patient?.full_name} — Online Payment`,
          html: buildPaymentConfirmedEmail({ patient, booking, treatmentList, formattedDate, amountLabel }),
        })

        console.log(`[PAYMENT_VERIFY] Confirmation emails sent`)
      }
      return NextResponse.redirect(new URL(`/book/confirmed?booking_id=${originalBookingId}`, req.url))
    }

    // Normal new booking flow
    console.log(`[PAYMENT_VERIFY] Creating new booking from payment`)
    
    await fetch(`${req.nextUrl.origin}/api/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm-booking',
        booking_id: orderId,
        cashfree_order_id: orderId,
        transaction_id: payment?.cf_payment_id || '',
      }),
    })
    
    console.log(`[PAYMENT_VERIFY] Success - redirecting to confirmed page`)
    return NextResponse.redirect(new URL(`/book/confirmed?booking_id=${orderId}`, req.url))
  } catch (error) {
    console.error('[PAYMENT_VERIFY] Error:', error)
    return NextResponse.redirect(new URL(`/book/payment-failed?order_id=${orderId}`, req.url))
  }
}

function buildPaymentConfirmedEmail({ patient, booking, treatmentList, formattedDate, amountLabel }: any) {
  const logoText = 'https://ayurshala-website.vercel.app/ayurshala_text.png'
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FFF3E0;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF3E0;padding:32px 16px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;background:#fff;border:1px solid rgba(22,163,74,0.2);box-shadow:0 8px 40px rgba(22,163,74,0.10)"><tr><td style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(22,163,74,0.15)"><img src="${logoText}" alt="Ayurshala" width="160" style="height:auto;display:block;margin:0 auto 12px"/><h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#15803d">✓ Payment Received — Booking Confirmed</h1></td></tr><tr><td style="padding:32px 40px"><table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-radius:14px;border:1px solid rgba(232,98,26,0.12)"><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Patient</span><br><span style="font-size:15px;color:#1a1008;font-weight:600">${patient?.full_name}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Booking ID</span><br><span style="font-size:15px;color:#E8621A">${booking.booking_id}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Treatment</span><br><span style="font-size:15px;color:#E8621A">${treatmentList}</span></td></tr><tr><td style="padding:12px 20px;border-bottom:1px solid rgba(232,98,26,0.08)"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Date &amp; Time</span><br><span style="font-size:15px;color:#1a1008">${formattedDate} · ${booking.preferred_time}</span></td></tr><tr><td style="padding:12px 20px"><span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e">Payment</span><br><span style="font-size:15px;color:#16a34a;font-weight:600">${amountLabel}</span></td></tr></table><p style="text-align:center;font-size:13px;color:#78716c;margin-top:20px">Please arrive 10 minutes early.<br>Questions? Call <a href="tel:+919821224767" style="color:#E8621A">+91-9821224767</a></p></td></tr><tr><td style="padding:20px 40px;text-align:center;background:#fffaf5"><p style="margin:0 0 4px;font-size:12px;color:#78716c">SP-28, Wajidpur, Sector-130, Noida — 201301</p><p style="margin:0;font-size:11px;color:#c4bdb5">© 2026 Ayurshala Panchakarma Center</p></td></tr></table></td></tr></table></body></html>`
}
