import { NextRequest, NextResponse } from 'next/server';
import { VisitService, VisitVitals } from '@/lib/emr/visit.service';

/**
 * POST /api/emr/visits/[visitId]/vitals
 * Record vitals for a visit
 * 
 * Body:
 * {
 *   "systolic_bp": 120,
 *   "diastolic_bp": 80,
 *   "pulse_rate": 72,
 *   "temperature_c": 98.6,
 *   "respiratory_rate": 16,
 *   "spo2": 98,
 *   "height_cm": 170,
 *   "weight_kg": 70,
 *   "recorded_by": "..." (user UUID)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const { visitId } = params;
    const body = await request.json();
    const {
      systolic_bp,
      diastolic_bp,
      pulse_rate,
      temperature_c,
      respiratory_rate,
      spo2,
      height_cm,
      weight_kg,
      recorded_by
    } = body;

    if (!visitId || !recorded_by) {
      return NextResponse.json(
        { success: false, error: 'Visit ID and recorded_by required' },
        { status: 400 }
      );
    }

    const vitals: VisitVitals = {
      systolic_bp,
      diastolic_bp,
      pulse_rate,
      temperature_c,
      respiratory_rate,
      spo2,
      height_cm,
      weight_kg
    };

    const visit = await VisitService.recordVitals(visitId, vitals, recorded_by);

    return NextResponse.json(
      { success: true, data: visit },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error recording vitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vitals' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/emr/visits/[visitId]/vitals
 * Get vitals for a visit (included in main visit response)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const { visitId } = params;

    const visit = await VisitService.getVisit(visitId);

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: visit.vitals },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vitals' },
      { status: 500 }
    );
  }
}
