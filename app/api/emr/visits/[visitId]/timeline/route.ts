import { NextRequest, NextResponse } from 'next/server';
import { VisitService } from '@/lib/emr/visit.service';

/**
 * GET /api/emr/visits/[visitId]/timeline
 * Get visit timeline events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const { visitId } = params;

    if (!visitId) {
      return NextResponse.json(
        { success: false, error: 'Visit ID required' },
        { status: 400 }
      );
    }

    const timeline = await VisitService.getTimeline(visitId);

    return NextResponse.json(
      { success: true, data: timeline },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emr/visits/[visitId]/timeline
 * Log a custom event (used by service layer for business events)
 * 
 * Body:
 * {
 *   "event_type": "PRESCRIPTION_CREATED",
 *   "title": "Prescription Generated",
 *   "description": "Dr. Sanjay prescribed 5 medicines",
 *   "actor_uuid": "...",
 *   "metadata": {
 *     "rx_count": 5,
 *     "medicines": ["Ashwagandha", "Shatavari"]
 *   }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const { visitId } = params;
    const body = await request.json();
    const { event_type, title, description, actor_uuid, metadata } = body;

    if (!visitId || !event_type || !title) {
      return NextResponse.json(
        { success: false, error: 'Visit ID, event_type, and title required' },
        { status: 400 }
      );
    }

    await VisitService.logTimelineEvent(
      visitId,
      event_type,
      title,
      description,
      actor_uuid,
      metadata
    );

    return NextResponse.json(
      { success: true, message: 'Event logged' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error logging timeline event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log event' },
      { status: 500 }
    );
  }
}
