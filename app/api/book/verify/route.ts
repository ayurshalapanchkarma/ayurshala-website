import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) return NextResponse.redirect(new URL('/book?status=error', req.url))

  try {
    const cashfree = new Cashfree(
      CFEnvironment.PRODUCTION,
      process.env.CASHFREE_APP_ID,
      process.env.CASHFREE_SECRET_KEY,
    )
    const response = await cashfree.PGOrderFetchPayments(orderId)
    const payment = response.data?.[0]
    const success = payment?.payment_status === 'SUCCESS'

    if (success) {
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('paymentid', orderId)
    }

    return NextResponse.redirect(new URL(success ? '/book?status=paid' : '/book?status=failed', req.url))
  } catch {
    return NextResponse.redirect(new URL('/book?status=error', req.url))
  }
}
