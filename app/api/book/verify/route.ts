import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) return NextResponse.redirect(new URL('/book?status=error', req.url))

  try {
    const cashfree = new Cashfree(CFEnvironment.PRODUCTION, process.env.CASHFREE_APP_ID, process.env.CASHFREE_SECRET_KEY)
    const response = await cashfree.PGOrderFetchPayments(orderId)
    const payment = response.data?.[0]
    const success = payment?.payment_status === 'SUCCESS'

    if (success) {
      // Confirm booking via API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-booking',
          booking_id: orderId,
          cashfree_order_id: orderId,
          transaction_id: payment?.cf_payment_id || '',
        }),
      })
      return NextResponse.redirect(new URL(`/book/confirmed?booking_id=${orderId}`, req.url))
    }

    return NextResponse.redirect(new URL('/book?status=failed', req.url))
  } catch {
    return NextResponse.redirect(new URL('/book?status=error', req.url))
  }
}
