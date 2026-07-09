import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * GET /api/inventory/export?format=csv&type=products
 * 
 * Export inventory data
 * - format: 'csv' | 'json'
 * - type: 'products' | 'suppliers' | 'categories' | 'stock'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'products'

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or json' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = `inventory-${type}-${new Date().toISOString().split('T')[0]}`

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

      if (error) throw error

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
      return NextResponse.json(
        { error: `No data available for export type: ${type}` },
        { status: 400 }
      )
    }

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

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
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
    console.error('[Export Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export data' },
      { status: 500 }
    )
  }
}
