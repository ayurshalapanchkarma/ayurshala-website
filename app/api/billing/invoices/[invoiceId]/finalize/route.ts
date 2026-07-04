import { NextRequest, NextResponse } from 'next/server';
import { HospitalBillingService } from '@/lib/inventory/hospital-billing-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const userId = request.headers.get('X-User-ID') || 'system';

    const invoice = await HospitalBillingService.finalizeInvoice(params.invoiceId, userId);

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    console.error('Finalize invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize invoice' },
      { status: 500 }
    );
  }
}
