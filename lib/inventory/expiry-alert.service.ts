import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ExpiryBatch {
  id: string
  batchNumber: string
  productId: string
  productName: string
  expDate: string
  currentQuantity: number
  daysUntilExpiry: number
  category: 'EXPIRED' | 'EXPIRING_7' | 'EXPIRING_30' | 'EXPIRING_60' | 'EXPIRING_90'
}

export interface LowStockItem {
  productId: string
  productName: string
  currentStock: number
  reorderLevel: number
  shortfall: number
}

export class ExpiryService {
  /**
   * Get batches by expiry status
   */
  static async getExpiringBatches(): Promise<ExpiryBatch[]> {
    const today = new Date()
    const d7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const d30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const d60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
    const d90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('id, batch_number, product_id, exp_date, current_quantity, inventory_products(id, name)')
      .eq('is_deleted', false)
      .neq('status', 'DEPLETED')
      .order('exp_date', { ascending: true })

    if (error) throw new Error(`Failed to fetch expiring batches: ${error.message}`)

    return (data || []).map((batch: any) => {
      const expDate = new Date(batch.exp_date)
      const diffTime = expDate.getTime() - today.getTime()
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let category: 'EXPIRED' | 'EXPIRING_7' | 'EXPIRING_30' | 'EXPIRING_60' | 'EXPIRING_90'

      if (expDate < today) category = 'EXPIRED'
      else if (expDate <= d7) category = 'EXPIRING_7'
      else if (expDate <= d30) category = 'EXPIRING_30'
      else if (expDate <= d60) category = 'EXPIRING_60'
      else if (expDate <= d90) category = 'EXPIRING_90'
      else category = 'EXPIRING_90' // Fallback

      return {
        id: batch.id,
        batchNumber: batch.batch_number,
        productId: batch.product_id,
        productName: batch.inventory_products?.name || 'Unknown',
        expDate: batch.exp_date,
        currentQuantity: batch.current_quantity,
        daysUntilExpiry,
        category,
      }
    })
  }

  /**
   * Mark expired batches automatically
   */
  static async markExpiredBatches(): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .update({ status: 'EXPIRED' })
      .lt('exp_date', today)
      .neq('status', 'EXPIRED')
      .select('id')

    if (error) throw new Error(`Failed to mark expired batches: ${error.message}`)
    return data?.map(b => b.id) || []
  }
}

export class AlertService {
  /**
   * Get low stock items
   */
  static async getLowStockItems(): Promise<LowStockItem[]> {
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .select('id, name, reorder_level, status')
      .eq('is_deleted', false)
      .eq('status', 'ACTIVE')

    if (error) throw new Error(`Failed to fetch products: ${error.message}`)

    const lowStockItems: LowStockItem[] = []

    for (const product of data || []) {
      // Calculate current stock from batches
      const { data: batches } = await supabaseAdmin
        .from('inventory_batches')
        .select('current_quantity')
        .eq('product_id', product.id)
        .eq('is_deleted', false)
        .neq('status', 'DEPLETED')

      const currentStock = (batches || []).reduce((sum: number, b: any) => sum + (b.current_quantity || 0), 0)

      if (currentStock <= product.reorder_level) {
        lowStockItems.push({
          productId: product.id,
          productName: product.name,
          currentStock,
          reorderLevel: product.reorder_level,
          shortfall: product.reorder_level - currentStock,
        })
      }
    }

    return lowStockItems
  }
}
