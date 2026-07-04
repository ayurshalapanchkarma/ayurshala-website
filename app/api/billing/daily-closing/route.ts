import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: closure } = await supabase
      .from('bill_daily_closure')
      .insert({
        closing_date: body.closingDate,
        cash_collected: body.cashCollected,
        cash_expected: body.cashExpected,
        cash_variance: body.cashVariance,
        upi_collected: body.upiCollected,
        upi_expected: body.upiExpected,
        upi_variance: body.upiVariance,
        card_collected: body.cardCollected,
        card_expected: body.cardExpected,
        card_variance: body.cardVariance,
        bank_collected: body.bankCollected,
        bank_expected: body.bankExpected,
        bank_variance: body.bankVariance,
        credit_collected: body.creditCollected,
        credit_expected: body.creditExpected,
        credit_variance: body.creditVariance,
        total_collected: body.totalCollected,
        total_expected: body.totalExpected,
        total_variance: body.totalVariance,
        notes: body.notes,
        closed_by: userId,
        closed_at: new Date().toISOString()
      })
      .select()
      .single();

    return NextResponse.json({ success: true, data: closure }, { status: 201 });
  } catch (error) {
    console.error('Daily closing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete daily closing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const dateStr = date || new Date().toISOString().split('T')[0];
    const nextDateStr = new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0];

    const { data: payments } = await supabase
      .from('bill_payments')
      .select('payment_mode, amount')
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${nextDateStr}T00:00:00`);

    const expected = {
      cashExpected: 0,
      upiExpected: 0,
      cardExpected: 0,
      bankExpected: 0,
      creditExpected: 0
    };

    (payments || []).forEach((p: any) => {
      const mode = p.payment_mode?.toUpperCase() || 'CASH';
      if (mode === 'CASH') expected.cashExpected += p.amount || 0;
      else if (mode === 'UPI') expected.upiExpected += p.amount || 0;
      else if (mode === 'CARD') expected.cardExpected += p.amount || 0;
      else if (mode === 'BANK_TRANSFER') expected.bankExpected += p.amount || 0;
      else if (mode === 'CREDIT') expected.creditExpected += p.amount || 0;
    });

    return NextResponse.json({ success: true, data: expected }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  }
}
