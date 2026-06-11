import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get gross revenue from payments
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'PAID')

    const grossRevenue = paidPayments?.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ) || 0

    // Get total refunds from bookings
    const { data: refundsData } = await supabase
      .from('bookings_new')
      .select('refund_amount')
      .eq('refund_status', 'REFUNDED')
      .gt('refund_amount', 0)

    const totalRefunds = refundsData?.reduce(
      (sum, booking) => sum + Number(booking.refund_amount || 0),
      0
    ) || 0

    const netRevenue = grossRevenue - totalRefunds

    return NextResponse.json({ 
      grossRevenue,
      totalRefunds,
      netRevenue,
      revenue: netRevenue // For backward compatibility
    })
  } catch (error) {
    console.error('Revenue fetch error:', error)
    return NextResponse.json({ grossRevenue: 0, totalRefunds: 0, netRevenue: 0, revenue: 0 }, { status: 500 })
  }
}
