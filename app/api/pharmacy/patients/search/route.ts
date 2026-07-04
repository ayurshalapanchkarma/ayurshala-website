import { NextRequest, NextResponse } from 'next/server';
import { PharmacyPatientService } from '@/lib/inventory/pharmacy-patient-service';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const patients = await PharmacyPatientService.searchPatients(query, limit);

    return NextResponse.json({ success: true, data: patients }, { status: 200 });
  } catch (error) {
    console.error('Patient search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}
