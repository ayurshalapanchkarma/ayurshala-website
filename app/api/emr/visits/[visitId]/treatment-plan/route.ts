import { NextRequest, NextResponse } from 'next/server';
import { TreatmentPlanService } from '@/lib/emr/panchakarma.service';

export async function GET(req: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new TreatmentPlanService();
    const treatmentPlan = await service.get(params.visitId);

    if (!treatmentPlan) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: treatmentPlan });
  } catch (error) {
    console.error('GET /treatment-plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { doctor_uuid } = body;

    if (!doctor_uuid) {
      return NextResponse.json({ error: 'doctor_uuid required' }, { status: 400 });
    }

    const service = new TreatmentPlanService();
    const treatmentPlan = await service.create(params.visitId, doctor_uuid, body);

    return NextResponse.json({ data: treatmentPlan }, { status: 201 });
  } catch (error) {
    console.error('POST /treatment-plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { doctor_uuid } = body;

    if (!doctor_uuid) {
      return NextResponse.json({ error: 'doctor_uuid required' }, { status: 400 });
    }

    const service = new TreatmentPlanService();
    const treatmentPlan = await service.update(params.visitId, doctor_uuid, body);

    return NextResponse.json({ data: treatmentPlan });
  } catch (error) {
    console.error('PUT /treatment-plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
