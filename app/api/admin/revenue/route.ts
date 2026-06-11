import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'PAID')

    const revenue = paidPayments?.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ) || 0

    return NextResponse.json({ revenue })
  } catch (error) {
    console.error('Revenue fetch error:', error)
    return NextResponse.json({ revenue: 0 }, { status: 500 })
  }
}
