import { NextRequest, NextResponse } from 'next/server';
import { TherapySessionService } from '@/lib/emr/panchakarma.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new TherapySessionService();
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('id');

    if (sessionId) {
      const session = await service.get(sessionId);
      return NextResponse.json({ data: session });
    }

    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  } catch (error) {
    console.error('GET /therapy-session error:', error);
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
    const { treatment_plan_uuid, created_by_uuid } = body;

    if (!treatment_plan_uuid || !created_by_uuid) {
      return NextResponse.json(
        { error: 'treatment_plan_uuid and created_by_uuid required' },
        { status: 400 }
      );
    }

    const service = new TherapySessionService();
    const therapySession = await service.create(
      params.visitId,
      treatment_plan_uuid,
      created_by_uuid,
      body
    );

    return NextResponse.json({ data: therapySession }, { status: 201 });
  } catch (error) {
    console.error('POST /therapy-session error:', error);
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
    const { session_id, created_by_uuid } = body;

    if (!session_id || !created_by_uuid) {
      return NextResponse.json(
        { error: 'session_id and created_by_uuid required' },
        { status: 400 }
      );
    }

    const service = new TherapySessionService();
    const therapySession = await service.update(session_id, created_by_uuid, body);

    return NextResponse.json({ data: therapySession });
  } catch (error) {
    console.error('PUT /therapy-session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
