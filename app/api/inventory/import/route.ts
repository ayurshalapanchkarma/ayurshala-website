import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * POST /api/inventory/import
 * 
 * Import products from CSV/Excel
 * 
 * Expected CSV columns:
 * - product_name (required)
 * - sku (required, unique)
 * - category_name (required, must exist)
 * - unit_name (required, must exist)
 * - supplier_name (optional)
 * - manufacturer_name (optional)
 * - purchase_price (optional)
 * - selling_price (optional)
 * - current_stock (optional)
 * - reorder_level (optional)
 * - description (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Parse CSV content
    const content = await file.text()
    const lines = content.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have header and at least one data row' },
        { status: 400 }
      )
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredColumns = ['product_name', 'sku', 'category_name', 'unit_name']
    const missingColumns = requiredColumns.filter(col => !header.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    // Parse data rows
    const products = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const obj: Record<string, string> = {}
      header.forEach((col, idx) => {
        obj[col] = values[idx] || ''
      })
      return obj
    })

    // Validate and import
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Get category and unit mappings
    const { data: categories } = await supabaseAdmin
      .from('inv_categories')
      .select('uuid, name')
      .eq('is_active', true)

    const { data: units } = await supabaseAdmin
      .from('inv_units')
      .select('uuid, name')
      .eq('is_active', true)

    const categoryMap = new Map((categories || []).map(c => [c.name.toLowerCase(), c.uuid]))
    const unitMap = new Map((units || []).map(u => [u.name.toLowerCase(), u.uuid]))

    // Import each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNum = i + 2

      try {
        // Validate required fields
        if (!product.product_name || !product.sku) {
          results.errors.push(`Row ${rowNum}: Missing product name or SKU`)
          results.skipped++
          continue
        }

        const categoryUuid = categoryMap.get(product.category_name?.toLowerCase())
        if (!categoryUuid) {
          results.errors.push(`Row ${rowNum}: Category "${product.category_name}" not found`)
          results.skipped++
          continue
        }

        const unitUuid = unitMap.get(product.unit_name?.toLowerCase())
        if (!unitUuid) {
          results.errors.push(`Row ${rowNum}: Unit "${product.unit_name}" not found`)
          results.skipped++
          continue
        }

        // Check for duplicate SKU
        const { data: existing } = await supabaseAdmin
          .from('inv_products')
          .select('uuid')
          .eq('sku', product.sku)
          .single()

        if (existing) {
          // Update existing
          const { error } = await supabaseAdmin
            .from('inv_products')
            .update({
              product_name: product.product_name,
              category_uuid: categoryUuid,
              unit_uuid: unitUuid,
              purchase_price: product.purchase_price ? parseFloat(product.purchase_price) : null,
              selling_price: product.selling_price ? parseFloat(product.selling_price) : null,
              reorder_level: product.reorder_level ? parseFloat(product.reorder_level) : null,
              description: product.description || null,
              updated_at: new Date().toISOString(),
            })
            .eq('uuid', existing.uuid)

          if (error) {
            results.errors.push(`Row ${rowNum}: Failed to update - ${error.message}`)
          } else {
            results.updated++
          }
        } else {
          // Create new
          const { error } = await supabaseAdmin
            .from('inv_products')
            .insert({
              product_name: product.product_name,
              sku: product.sku,
              category_uuid: categoryUuid,
              unit_uuid: unitUuid,
              purchase_price: product.purchase_price ? parseFloat(product.purchase_price) : null,
              selling_price: product.selling_price ? parseFloat(product.selling_price) : null,
              current_stock: product.current_stock ? parseFloat(product.current_stock) : 0,
              reorder_level: product.reorder_level ? parseFloat(product.reorder_level) : 0,
              description: product.description || null,
              is_active: true,
            })

          if (error) {
            results.errors.push(`Row ${rowNum}: Failed to create - ${error.message}`)
          } else {
            results.created++
          }
        }
      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results,
    })
  } catch (error) {
    console.error('[Import Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import products' },
      { status: 500 }
    )
  }
}
