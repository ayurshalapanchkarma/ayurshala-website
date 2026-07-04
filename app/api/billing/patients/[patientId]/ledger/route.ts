import { NextRequest, NextResponse } from 'next/server';
import { HospitalBillingService } from '@/lib/inventory/hospital-billing-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const type = request.nextUrl.searchParams.get('type') || 'ledger';

    if (type === 'ledger') {
      const ledger = await HospitalBillingService.getPatientLedger(params.patientId);
      return NextResponse.json({ success: true, data: ledger }, { status: 200 });
    }

    if (type === 'balance') {
      const balance = await HospitalBillingService.getPatientBalance(params.patientId);
      return NextResponse.json({ success: true, data: { balance } }, { status: 200 });
    }

    if (type === 'invoices') {
      const invoices = await HospitalBillingService.getPatientInvoices(params.patientId);
      return NextResponse.json({ success: true, data: invoices }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Patient ledger error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient data' },
      { status: 500 }
    );
  }
}
