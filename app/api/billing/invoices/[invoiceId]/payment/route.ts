import { NextRequest, NextResponse } from 'next/server';
import { HospitalBillingService, Payment } from '@/lib/inventory/hospital-billing-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const payment: Payment = {
      id: '',
      amount: body.amount,
      payment_mode: body.paymentMode,
      payment_date: new Date().toISOString(),
      reference_number: body.referenceNumber,
      notes: body.notes
    };

    await HospitalBillingService.recordPayment(params.invoiceId, payment, userId);

    return NextResponse.json({ success: true, message: 'Payment recorded' }, { status: 200 });
  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
