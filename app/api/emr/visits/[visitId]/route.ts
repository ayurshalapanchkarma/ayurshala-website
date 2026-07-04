import { NextRequest, NextResponse } from 'next/server';
import { VisitService, VisitVitals } from '@/lib/emr/visit.service';

/**
 * GET /api/emr/visits/[visitId]
 * Get visit details
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

    const visit = await VisitService.getVisit(visitId);

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: visit },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visit' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/emr/visits/[visitId]
 * Update visit status or notes
 * 
 * Body:
 * {
 *   "visit_status": "IN_CONSULTATION" | "PRESCRIPTION_READY" | "COMPLETED" | etc.
 *   "notes": "...",
 *   "updated_by": "..." (user UUID)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const { visitId } = params;
    const body = await request.json();
    const { visit_status, notes, updated_by } = body;

    if (!visitId || !updated_by) {
      return NextResponse.json(
        { success: false, error: 'Visit ID and updated_by required' },
        { status: 400 }
      );
    }

    let visit;

    if (visit_status) {
      visit = await VisitService.updateVisitStatus(
        visitId,
        visit_status,
        updated_by
      );
    } else if (notes !== undefined) {
      // Just update notes - handled via direct Supabase client if needed
      // For now, we focus on status updates
    }

    if (!visit) {
      return NextResponse.json(
        { success: false, error: 'Failed to update visit' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: visit },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update visit' },
      { status: 500 }
    );
  }
}
