import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ProductService } from '@/lib/inventory/product-service-v2'
import { ValidationError } from '@/lib/inventory/validators'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log(`[Products GET] Fetching product: ${id}`)

    // Get product with all related data using v_current_stock view
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from('v_current_stock')
      .select(`
        product_uuid,
        product_code,
        product_name,
        generic_name,
        barcode,
        category_name,
        unit,
        manufacturer_name,
        available_qty,
        reorder_level,
        minimum_stock,
        maximum_stock,
        purchase_price,
        selling_price,
        mrp,
        is_active
      `)
      .eq('product_uuid', id)
      .single()

    if (stockError || !stockData) {
      console.error(`[Products GET] Stock data error:`, stockError)
      throw new Error('Product not found')
    }

    // Get additional product details
    const { data: productData, error: productError } = await supabaseAdmin
      .from('inv_products')
      .select(`
        uuid,
        product_code,
        sku,
        barcode,
        product_name,
        generic_name,
        category_uuid,
        manufacturer_uuid,
        unit_uuid,
        default_supplier_uuid,
        purchase_price,
        selling_price,
        mrp,
        gst_percentage,
        hsn_code,
        minimum_stock,
        reorder_level,
        maximum_stock,
        storage_location,
        rack_number,
        shelf_number,
        bin_number,
        batch_tracking,
        expiry_tracking,
        is_prescription,
        is_consumable,
        is_service_item,
        description,
        is_active
      `)
      .eq('uuid', id)
      .single()

    if (productError || !productData) {
      console.error(`[Products GET] Product error:`, productError)
      throw new Error('Product not found')
    }

    // Get supplier name if exists
    let supplierName = null
    if (productData.default_supplier_uuid) {
      const { data: supplierData } = await supabaseAdmin
        .from('inv_suppliers')
        .select('company_name')
        .eq('uuid', productData.default_supplier_uuid)
        .single()
      supplierName = supplierData?.company_name || null
    }

    // Combine data
    const result = {
      ...productData,
      available_qty: stockData.available_qty,
      category_name: stockData.category_name,
      unit: stockData.unit,
      manufacturer_name: stockData.manufacturer_name,
      company_name: supplierName,
    }

    console.log(`[Products GET] Product fetched successfully:`, result.product_name)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: error.message || 'Product not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const input = await request.json()
    const result = await ProductService.updateProduct(id, input)
    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    console.log(`[Products DELETE] Deleting product: ${id}`)

    // Get product stock to check validation
    const { data: product, error: getError } = await supabaseAdmin
      .from('v_current_stock')
      .select('available_qty, product_name')
      .eq('product_uuid', id)
      .single()

    if (getError || !product) {
      console.error(`[Products DELETE] Error getting product:`, getError)
      throw new Error('Product not found')
    }

    // Check if product has stock
    if (product.available_qty && product.available_qty > 0) {
      const errorMsg = `Cannot delete product with current stock (${product.available_qty} units available)`
      console.error(`[Products DELETE] Validation failed:`, errorMsg)
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      )
    }

    // Soft delete by marking is_active = false (view filters on is_active)
    const { error: deleteError } = await supabaseAdmin
      .from('inv_products')
      .update({
        is_active: false,
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('uuid', id)

    if (deleteError) {
      console.error(`[Products DELETE] Update error:`, deleteError)
      throw deleteError
    }

    console.log(`[Products DELETE] Product deleted successfully:`, product.product_name)
    return NextResponse.json({ success: true, message: 'Product marked as inactive' })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
