import { NextRequest, NextResponse } from 'next/server';
import { VisitService, VisitInput } from '@/lib/emr/visit.service';

/**
 * POST /api/emr/visits
 * Create a new visit
 * 
 * Body:
 * {
 *   "patient_uuid": "...",
 *   "doctor_uuid": "...",
 *   "visit_date": "2026-07-04",
 *   "visit_type": "OPD",
 *   "chief_complaint": "...",
 *   "created_by": "..." (user UUID)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_uuid, doctor_uuid, visit_date, visit_type, chief_complaint, created_by } = body;

    // Validate required fields
    if (!patient_uuid || !doctor_uuid || !visit_date || !created_by) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: patient_uuid, doctor_uuid, visit_date, created_by'
        },
        { status: 400 }
      );
    }

    const visitInput: VisitInput = {
      patient_uuid,
      doctor_uuid,
      visit_date,
      visit_type,
      chief_complaint,
      created_by
    };

    const visit = await VisitService.createVisit(visitInput);

    return NextResponse.json(
      { success: true, data: visit },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/emr/visits?queue_type=reception|doctor&doctor_uuid=...
 * Get visits:
 * - queue_type=reception: Today's entire queue
 * - queue_type=doctor&doctor_uuid=xyz: Specific doctor's queue
 */
export async function GET(request: NextRequest) {
  try {
    const queueType = request.nextUrl.searchParams.get('queue_type') || 'reception';
    const doctorUuid = request.nextUrl.searchParams.get('doctor_uuid');

    if (queueType === 'doctor' && !doctorUuid) {
      return NextResponse.json(
        { success: false, error: 'doctor_uuid required for doctor queue' },
        { status: 400 }
      );
    }

    let data;

    if (queueType === 'doctor') {
      data = await VisitService.getDoctorQueue(doctorUuid!);
    } else {
      data = await VisitService.getTodaysQueue();
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}
