/**
 * Current Stock Report API
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReportService } from '@/lib/inventory/report-service'

export async function GET(request: NextRequest) {
  try {
    console.log('========== GET /api/inventory/reports/current-stock START ==========')
    
    const { searchParams } = new URL(request.url)
    const category_uuid = searchParams.get('category_uuid') || undefined

    console.log('Query params:', { category_uuid })

    const report = await ReportService.getCurrentStockReport({
      category_uuid,
    })

    console.log('Report generated, items:', report?.length)

    const csv = convertToCSV(report, ['product_code', 'product_name', 'category', 'unit', 'current_stock', 'reorder_level', 'purchase_price', 'stock_value', 'batch_count', 'status'])
    
    console.log('========== GET /api/inventory/reports/current-stock END (SUCCESS) ==========')
    
    return NextResponse.json({
      data: report,
      export: {
        csv,
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('========== GET /api/inventory/reports/current-stock ERROR ==========')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error?.message)
    console.error('Full error:', error)
    console.error('========== END ERROR ==========')
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to generate current stock report',
        details: {
          type: error?.constructor?.name,
          originalMessage: error?.message,
        }
      }, 
      { status: 500 }
    )
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
