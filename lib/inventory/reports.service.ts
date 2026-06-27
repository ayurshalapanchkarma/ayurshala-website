import { supabaseAdmin } from '@/lib/supabase-admin'

export class ReportsService {
  /**
   * Stock ledger report
   */
  static async getStockLedgerReport(productId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    let query = supabaseAdmin
      .from('stock_ledger')
      .select('*')
      .order('created_at', { ascending: false })

    if (productId) query = query.eq('product_id', productId)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch ledger report: ${error.message}`)
    return data || []
  }

  /**
   * Current stock report
   */
  static async getCurrentStockReport(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .select('id, name, sku, category_id, status')
      .eq('is_deleted', false)
      .eq('status', 'ACTIVE')

    if (error) throw new Error(`Failed to fetch products: ${error.message}`)

    const report: any[] = []

    for (const product of data || []) {
      const { data: batches } = await supabaseAdmin
        .from('inventory_batches')
        .select('current_quantity, purchase_price, status')
        .eq('product_id', product.id)
        .eq('is_deleted', false)

      const totalQty = (batches || []).reduce((sum: number, b: any) => sum + (b.current_quantity || 0), 0)
      const totalValue = (batches || []).reduce(
        (sum: number, b: any) => sum + (b.current_quantity || 0) * (b.purchase_price || 0),
        0,
      )

      report.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: totalQty,
        value: totalValue,
        batchCount: batches?.length || 0,
      })
    }

    return report
  }

  /**
   * Batch report with expiry
   */
  static async getBatchReport(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('*, inventory_products(name, sku)')
      .eq('is_deleted', false)
      .order('exp_date', { ascending: true })

    if (error) throw new Error(`Failed to fetch batches: ${error.message}`)

    return (data || []).map((batch: any) => ({
      batchNumber: batch.batch_number,
      productName: batch.inventory_products?.name,
      productSku: batch.inventory_products?.sku,
      mfgDate: batch.mfg_date,
      expDate: batch.exp_date,
      quantity: batch.current_quantity,
      status: batch.status,
      value: (batch.current_quantity || 0) * (batch.purchase_price || 0),
    }))
  }

  /**
   * Low stock report
   */
  static async getLowStockReport(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .select('id, name, sku, reorder_level, status')
      .eq('is_deleted', false)
      .eq('status', 'ACTIVE')

    if (error) throw new Error(`Failed to fetch products: ${error.message}`)

    const report: any[] = []

    for (const product of data || []) {
      const { data: batches } = await supabaseAdmin
        .from('inventory_batches')
        .select('current_quantity')
        .eq('product_id', product.id)
        .eq('is_deleted', false)
        .neq('status', 'DEPLETED')

      const currentQty = (batches || []).reduce((sum: number, b: any) => sum + (b.current_quantity || 0), 0)

      if (currentQty <= product.reorder_level) {
        report.push({
          productName: product.name,
          productSku: product.sku,
          currentStock: currentQty,
          reorderLevel: product.reorder_level,
          shortfall: product.reorder_level - currentQty,
        })
      }
    }

    return report
  }

  /**
   * Inventory valuation report (FIFO)
   */
  static async getInventoryValuationReport(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('*, inventory_products(name, sku)')
      .eq('is_deleted', false)
      .neq('status', 'DEPLETED')

    if (error) throw new Error(`Failed to fetch batches: ${error.message}`)

    const valuation = (data || []).map((batch: any) => ({
      productName: batch.inventory_products?.name,
      productSku: batch.inventory_products?.sku,
      quantity: batch.current_quantity,
      purchasePrice: batch.purchase_price,
      value: (batch.current_quantity || 0) * (batch.purchase_price || 0),
      valuationMethod: 'FIFO',
    }))

    return valuation
  }
}
