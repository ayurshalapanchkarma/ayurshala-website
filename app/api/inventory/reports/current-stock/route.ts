/**
 * Current Stock Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category_uuid = searchParams.get('category_uuid') || undefined

    const report = await ReportService.getCurrentStockReport({
      category_uuid,
    })

    const csv = convertToCSV(report, ['product_code', 'product_name', 'category', 'unit', 'current_stock', 'reorder_level', 'purchase_price', 'stock_value', 'batch_count', 'status'])
    
    return NextResponse.json({
      data: report,
      export: {
        csv,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('GET /api/inventory/reports/current-stock error:', error)
    return NextResponse.json({ error: 'Failed to generate current stock report' }, { status: 500 })
  }
}

function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) return ''
  
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}
