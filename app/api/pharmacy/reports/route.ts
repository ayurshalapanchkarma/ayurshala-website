import { NextRequest, NextResponse } from 'next/server';
import { PharmacyReportService, ReportFilters } from '@/lib/inventory/pharmacy-report-service';

export async function GET(request: NextRequest) {
  try {
    const reportType = request.nextUrl.searchParams.get('type') || 'daily-sales';
    const fromDate = request.nextUrl.searchParams.get('fromDate');
    const toDate = request.nextUrl.searchParams.get('toDate');
    const paymentMode = request.nextUrl.searchParams.get('paymentMode');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    const filters: ReportFilters = {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      paymentMode: paymentMode || undefined,
      limit
    };

    let data;

    switch (reportType) {
      case 'daily-sales':
        data = await PharmacyReportService.getDailySalesReport(filters);
        break;
      case 'medicine-sales':
        data = await PharmacyReportService.getMedicineSalesReport(filters);
        break;
      case 'patient-sales':
        data = await PharmacyReportService.getPatientSalesReport(filters);
        break;
      case 'payment':
        data = await PharmacyReportService.getPaymentReport(filters);
        break;
      case 'returns':
        data = await PharmacyReportService.getReturnReport(filters);
        break;
      case 'discounts':
        data = await PharmacyReportService.getDiscountReport(filters);
        break;
      case 'gst':
        data = await PharmacyReportService.getGSTReport(filters);
        break;
      case 'consumption':
        data = await PharmacyReportService.getConsumptionReport(filters);
        break;
      case 'profit':
        data = await PharmacyReportService.getProfitReport(filters);
        break;
      case 'inventory-linkage':
        data = await PharmacyReportService.getInventoryLinkageReport(filters);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
