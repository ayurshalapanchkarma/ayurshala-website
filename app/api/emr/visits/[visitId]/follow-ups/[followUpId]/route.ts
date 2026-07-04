import { NextRequest, NextResponse } from 'next/server';
import { FollowUpService } from '@/lib/emr/follow-up.service';

export async function PUT(
  req: NextRequest,
  { params }: { params: { visitId: string; followUpId: string } }
) {
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
    const followUp = await service.update(params.followUpId, doctor_uuid, body);

    return NextResponse.json({ data: followUp });
  } catch (error) {
    console.error('PUT /follow-up error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
