import { FinanceReportsService } from '@/lib/inventory'
import { handleApiError, successResponse } from '@/lib/inventory/api-helper'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ reportType: string }> },
) {
  try {
    const { reportType } = await params
    const url = new URL(_.url)
    const fromDate = url.searchParams.get('fromDate') || new Date().toISOString().split('T')[0]
    const toDate = url.searchParams.get('toDate') || new Date().toISOString().split('T')[0]

    let report

    switch (reportType) {
      case 'revenue':
        report = await FinanceReportsService.getRevenueReport(fromDate, toDate)
        break
      case 'collection':
        report = await FinanceReportsService.getCollectionReport(fromDate, toDate)
        break
      case 'outstanding':
        report = await FinanceReportsService.getOutstandingReport()
        break
      case 'gst':
        report = await FinanceReportsService.getGSTReport(fromDate, toDate)
        break
      case 'refund':
        report = await FinanceReportsService.getRefundReport(fromDate, toDate)
        break
      case 'package-utilization':
        report = await FinanceReportsService.getPackageUtilization()
        break
      case 'treatment-revenue':
        report = await FinanceReportsService.getTreatmentRevenue(fromDate, toDate)
        break
      case 'medicine-revenue':
        report = await FinanceReportsService.getMedicineRevenue(fromDate, toDate)
        break
      default:
        throw new Error('Unknown report type')
    }

    return successResponse(report)
  } catch (error) {
    return handleApiError(error)
  }
}
