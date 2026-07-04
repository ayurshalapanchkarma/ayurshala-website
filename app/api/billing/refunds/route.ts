import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: refund } = await supabase
      .from('bill_refunds')
      .insert({
        invoice_id: body.invoiceId,
        refund_amount: body.amount,
        reason: body.reason,
        status: 'DRAFT',
        notes: body.notes,
        created_by: userId,
        is_deleted: false
      })
      .select()
      .single();

    return NextResponse.json({ success: true, data: refund }, { status: 201 });
  } catch (error) {
    console.error('Create refund error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create refund' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('bill_refunds')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Get refunds error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}
