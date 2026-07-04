import { NextRequest, NextResponse } from 'next/server';
import { TimelineService } from '@/lib/emr/follow-up.service';

export async function GET(req: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = new TimelineService();
    const timeline = await service.getTimeline(params.visitId);

    return NextResponse.json({ data: timeline });
  } catch (error) {
    console.error('GET /timeline error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
