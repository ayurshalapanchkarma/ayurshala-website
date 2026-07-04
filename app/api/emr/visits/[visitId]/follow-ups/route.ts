import { NextRequest, NextResponse } from 'next/server';
import { FollowUpService } from '@/lib/emr/follow-up.service';

export async function GET(req: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new FollowUpService();
    const followUps = await service.list(params.visitId);

    return NextResponse.json({ data: followUps });
  } catch (error) {
    console.error('GET /follow-ups error:', error);
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

    const service = new FollowUpService();
    const followUp = await service.create(params.visitId, doctor_uuid, body);

    return NextResponse.json({ data: followUp }, { status: 201 });
  } catch (error) {
    console.error('POST /follow-ups error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
