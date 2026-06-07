import { Cashfree, CFEnvironment } from 'cashfree-pg'
import { NextRequest, NextResponse } from 'next/server'

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY,
)

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) return NextResponse.redirect(new URL('/book?status=error', req.url))

  try {
    const response = await cashfree.PGOrderFetchPayments(orderId)
    const payment = response.data?.[0]
    const success = payment?.payment_status === 'SUCCESS'
    const url = new URL(success ? '/book?status=paid' : '/book?status=failed', req.url)
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL('/book?status=error', req.url))
  }
}
