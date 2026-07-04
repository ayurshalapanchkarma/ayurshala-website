import { NextRequest, NextResponse } from 'next/server';
import { PharmacyDashboardService } from '@/lib/inventory/pharmacy-dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const fromDate = request.nextUrl.searchParams.get('fromDate');
    const toDate = request.nextUrl.searchParams.get('toDate');

    const metrics = await PharmacyDashboardService.getDashboardMetrics({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    });

    return NextResponse.json({ success: true, data: metrics }, { status: 200 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard metrics' },
      { status: 500 }
    );
  }
}
