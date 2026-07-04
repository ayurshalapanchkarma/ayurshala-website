import { NextRequest, NextResponse } from 'next/server';
import { PharmacyPatientService } from '@/lib/inventory/pharmacy-patient-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const historyType = request.nextUrl.searchParams.get('type') || 'history';

    if (historyType === 'history') {
      const history = await PharmacyPatientService.getPatientMedicineHistory(params.patientId);
      return NextResponse.json({ success: true, data: history }, { status: 200 });
    }

    if (historyType === 'balance') {
      const balance = await PharmacyPatientService.getPatientBalance(params.patientId);
      return NextResponse.json({ success: true, data: balance }, { status: 200 });
    }

    if (historyType === 'bills') {
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
      const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
      const bills = await PharmacyPatientService.getPatientBills(params.patientId, limit, offset);
      return NextResponse.json({ success: true, data: bills }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Patient detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load patient details' },
      { status: 500 }
    );
  }
}
