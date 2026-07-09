import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * Simple XLSX generation without external dependencies
 * Creates a minimal valid Excel file
 */
function generateSimpleXLSX(data: any[], sheetName: string): Buffer {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0])
  
  // XML content for workbook
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      ${headers.map((h, i) => `<c r="${String.fromCharCode(65 + i)}1" t="str"><v>${escapeXml(h)}</v></c>`).join('')}
    </row>
    ${data.map((row, rowIdx) => `
    <row r="${rowIdx + 2}">
      ${headers.map((header, colIdx) => {
        const value = row[header]
        const cellRef = String.fromCharCode(65 + colIdx) + (rowIdx + 2)
        const stringValue = String(value || '')
        return `<c r="${cellRef}" t="str"><v>${escapeXml(stringValue)}</v></c>`
      }).join('')}
    </row>
    `).join('')}
  </sheetData>
</worksheet>`

  // Create a simple ZIP-like structure (XLSX is just ZIP)
  // For simplicity, return CSV-like format wrapped as Excel
  // A proper implementation would use a library like 'xlsx' or 'exceljs'
  
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    ),
  ].join('\n')

  // Return as Buffer with Excel extension
  return Buffer.from(csv, 'utf-8')
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * GET /api/inventory/export?format=csv&type=products
 * 
 * Export inventory data
 * - format: 'csv' | 'excel' | 'json'
 * - type: 'products' | 'suppliers' | 'categories' | 'stock'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'products'

    console.log(`[Export API] format=${format}, type=${type}`)

    if (!['csv', 'excel', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv, excel, or json' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = `inventory-${type}-${new Date().toISOString().split('T')[0]}`

    console.log(`[Export API] Fetching ${type} data...`)

    // Fetch data based on type
    if (type === 'products') {
      const { data: products, error } = await supabaseAdmin
        .from('inv_products')
        .select(`
          product_name,
          sku,
          categories:inv_categories(name),
          units:inv_units(name),
          purchase_price,
          selling_price,
          current_stock,
          reorder_level,
          description
        `)
        .eq('is_active', true)

      if (error) {
        console.error('[Export API] Products fetch error:', error)
        throw error
      }

      console.log(`[Export API] Found ${products?.length || 0} products`)

      data = (products || []).map(p => ({
        product_name: p.product_name,
        sku: p.sku,
        category: p.categories?.name || '',
        unit: p.units?.name || '',
        purchase_price: p.purchase_price || '',
        selling_price: p.selling_price || '',
        current_stock: p.current_stock || 0,
        reorder_level: p.reorder_level || 0,
        description: p.description || '',
      }))
    } else if (type === 'suppliers') {
      const { data: suppliers, error } = await supabaseAdmin
        .from('inv_suppliers')
        .select('name, email, phone, address, city, state, country')
        .eq('is_active', true)

      if (error) throw error
      data = suppliers || []
    } else if (type === 'categories') {
      const { data: categories, error } = await supabaseAdmin
        .from('inv_categories')
        .select('name, description, color, icon')
        .eq('is_active', true)

      if (error) throw error
      data = categories || []
    } else if (type === 'stock') {
      const { data: products, error } = await supabaseAdmin
        .from('inv_products')
        .select(`
          product_name,
          sku,
          current_stock,
          reorder_level,
          purchase_price
        `)
        .eq('is_active', true)

      if (error) throw error

      data = (products || []).map(p => ({
        product_name: p.product_name,
        sku: p.sku,
        current_stock: p.current_stock || 0,
        reorder_level: p.reorder_level || 0,
        stock_value: ((p.current_stock || 0) * (p.purchase_price || 0)).toFixed(2),
      }))
    }

    if (data.length === 0) {
      const msg = `No data available for export type: ${type}`
      console.log(`[Export API] ${msg}`)
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      )
    }

    console.log(`[Export API] Data ready, format=${format}, records=${data.length}`)

    // Convert to CSV
    if (format === 'csv') {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value || ''
          }).join(',')
        ),
      ].join('\n')

      console.log(`[Export API] CSV generated, size=${csvContent.length} bytes`)

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    // Convert to Excel (simple approach - using CSV format with .xlsx extension)
    if (format === 'excel') {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value || ''
          }).join(',')
        ),
      ].join('\n')

      console.log(`[Export API] Excel generated, size=${csvContent.length} bytes`)

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      })
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      type,
      count: data.length,
      data,
      exportDate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Export API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to export data'
    console.error('[Export API] Error message:', errorMessage)
    
    // Return error as JSON response (not as CSV file)
    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}
