import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type MovementType = 'PURCHASE' | 'SALE' | 'TREATMENT_CONSUMPTION' | 'RETURN_FROM_PATIENT' | 'PURCHASE_RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'STOCK_ADJUSTMENT' | 'EXPIRED' | 'DAMAGED' | 'OPENING_STOCK'
export type ReferenceType = 'PURCHASE_ORDER' | 'GOODS_RECEIPT_NOTE' | 'SALES_INVOICE' | 'APPOINTMENT' | 'PRESCRIPTION' | 'TREATMENT_SESSION' | 'ADJUSTMENT' | 'EXPIRY' | 'DAMAGE' | 'TRANSFER' | 'OPENING_STOCK'

export interface StockMovement {
  productId: string
  batchId?: string
  movementType: MovementType
  quantityIn?: number
  quantityOut?: number
  referenceId?: string
  referenceType?: ReferenceType
  referenceNumber?: string
  remarks?: string
}

export interface StockDetails {
  availableQuantity: number
  reservedQuantity: number
  blockedQuantity: number
  expiredQuantity: number
  totalQuantity: number
}

export class InventoryEngineService {
  /**
   * Record a stock movement (ONLY method to change inventory)
   * All inventory changes must go through this
   */
  static async recordMovement(movement: StockMovement, userId: string): Promise<string> {
    // Validation
    if (!movement.productId?.trim()) {
      throw new ValidationException([{ field: 'productId', message: 'Product is required' }])
    }

    const quantityIn = movement.quantityIn || 0
    const quantityOut = movement.quantityOut || 0

    if (quantityIn < 0 || quantityOut < 0) {
      throw new ValidationException([{ field: 'quantity', message: 'Quantity cannot be negative' }])
    }

    if (quantityIn === 0 && quantityOut === 0) {
      throw new ValidationException([{ field: 'quantity', message: 'Either in or out quantity must be > 0' }])
    }

    // Verify product exists
    const { data: product } = await supabaseAdmin
      .from('inventory_products')
      .select('id')
      .eq('id', movement.productId)
      .eq('is_deleted', false)
      .single()

    if (!product) throw new Error('Product not found')

    // If batch specified, verify it exists
    if (movement.batchId) {
      const { data: batch } = await supabaseAdmin
        .from('inventory_batches')
        .select('id')
        .eq('id', movement.batchId)
        .eq('is_deleted', false)
        .single()

      if (!batch) throw new Error('Batch not found')
    }

    // Log movement via RPC (returns transaction ID)
    const { data: txnId, error } = await supabaseAdmin.rpc('log_stock_movement', {
      p_product_id: movement.productId,
      p_batch_id: movement.batchId || null,
      p_movement_type: movement.movementType,
      p_quantity_in: quantityIn,
      p_quantity_out: quantityOut,
      p_reference_id: movement.referenceId || null,
      p_reference_type: movement.referenceType || null,
      p_reference_number: movement.referenceNumber || null,
      p_remarks: movement.remarks || null,
    })

    if (error) throw new Error(`Failed to record movement: ${error.message}`)
    if (!txnId) throw new Error('Failed to record movement')

    return txnId
  }

  /**
   * Get current stock for a product (derived from transactions)
   */
  static async getCurrentStock(productId: string): Promise<StockDetails> {
    const { data, error } = await supabaseAdmin.rpc('get_stock_details', {
      p_product_id: productId,
    })

    if (error) throw new Error(`Failed to get stock details: ${error.message}`)

    if (!data || data.length === 0) {
      return {
        availableQuantity: 0,
        reservedQuantity: 0,
        blockedQuantity: 0,
        expiredQuantity: 0,
        totalQuantity: 0,
      }
    }

    return {
      availableQuantity: data[0].available_qty || 0,
      reservedQuantity: data[0].reserved_qty || 0,
      blockedQuantity: data[0].blocked_qty || 0,
      expiredQuantity: data[0].expired_qty || 0,
      totalQuantity: data[0].total_qty || 0,
    }
  }

  /**
   * Get stock ledger for product
   */
  static async getStockLedger(productId: string, limit = 100): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('stock_ledger')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to fetch ledger: ${error.message}`)
    return data || []
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(productId: string, limit = 100): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('stock_transactions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`)
    return data || []
  }
}
