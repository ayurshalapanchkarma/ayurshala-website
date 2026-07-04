import { NextRequest, NextResponse } from 'next/server';
import { HospitalBillingService } from '@/lib/inventory/hospital-billing-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const invoice = await HospitalBillingService.getInvoiceById(params.invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('bill_invoices')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.invoiceId)
      .select()
      .single();

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
