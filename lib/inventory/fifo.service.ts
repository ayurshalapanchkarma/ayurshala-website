import { supabaseAdmin } from '@/lib/supabase-admin'
import { InventoryEngineService } from './inventory-engine.service'

export interface FIFOConsumption {
  batchId: string
  quantityToConsume: number
}

export class FIFOService {
  /**
   * Get FIFO batches for consumption (oldest first, active only)
   */
  static async getFIFOBatches(productId: string, requiredQuantity: number): Promise<FIFOConsumption[]> {
    const { data: batches, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('id, current_quantity, exp_date, status')
      .eq('product_id', productId)
      .eq('is_deleted', false)
      .in('status', ['ACTIVE', 'LOW_STOCK'])
      .order('exp_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch FIFO batches: ${error.message}`)

    const consumptions: FIFOConsumption[] = []
    let remaining = requiredQuantity

    for (const batch of batches || []) {
      if (remaining <= 0) break

      // Check if expired
      if (batch.exp_date && new Date(batch.exp_date) < new Date()) {
        continue // Skip expired batches
      }

      const available = batch.current_quantity
      const toConsume = Math.min(available, remaining)

      if (toConsume > 0) {
        consumptions.push({
          batchId: batch.id,
          quantityToConsume: toConsume,
        })
        remaining -= toConsume
      }
    }

    if (remaining > 0) {
      throw new Error(`Insufficient stock: Need ${requiredQuantity}, but only ${requiredQuantity - remaining} available`)
    }

    return consumptions
  }

  /**
   * Consume stock using FIFO
   */
  static async consumeStock(productId: string, quantityToConsume: number, movementType: any, referenceNumber?: string, remarks?: string): Promise<string[]> {
    const fifoList = await this.getFIFOBatches(productId, quantityToConsume)
    const transactionIds: string[] = []

    for (const consumption of fifoList) {
      const txnId = await InventoryEngineService.recordMovement(
        {
          productId,
          batchId: consumption.batchId,
          movementType,
          quantityOut: consumption.quantityToConsume,
          referenceNumber,
          remarks,
        },
        '', // userId will be set by auth context
      )

      transactionIds.push(txnId)

      // Update batch quantity
      await supabaseAdmin
        .from('inventory_batches')
        .update({ current_quantity: supabaseAdmin.rpc('current_quantity - $1', { '1': consumption.quantityToConsume }) })
        .eq('id', consumption.batchId)
    }

    return transactionIds
  }
}
