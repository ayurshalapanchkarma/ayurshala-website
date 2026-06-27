import { supabaseAdmin } from '@/lib/supabase-admin'
import { InventoryEngineService } from './inventory-engine.service'
import { ValidationException } from './types'

export type ReturnReason = 'WRONG_MEDICINE' | 'EXPIRED' | 'DAMAGED' | 'PATIENT_RETURNED' | 'BILLING_ERROR'

export interface ReturnItem {
  saleItemId: string
  quantity: number
}

export interface CreateReturnInput {
  saleId: string
  items: ReturnItem[]
  reason: ReturnReason
  notes?: string
}

export class ReturnsService {
  /**
   * Create return and restore inventory
   */
  static async createReturn(input: CreateReturnInput, userId: string): Promise<any> {
    if (!input.saleId?.trim()) {
      throw new ValidationException([{ field: 'saleId', message: 'Sale ID required' }])
    }

    if (!input.items || input.items.length === 0) {
      throw new ValidationException([{ field: 'items', message: 'At least one item required' }])
    }

    // Get sale
    const { data: sale } = await supabaseAdmin.from('sales').select('*').eq('id', input.saleId).single()

    if (!sale) throw new Error('Sale not found')

    // Validate return items
    for (const item of input.items) {
      const { data: saleItem } = await supabaseAdmin
        .from('sale_items')
        .select('*')
        .eq('id', item.saleItemId)
        .eq('sale_id', input.saleId)
        .single()

      if (!saleItem) throw new Error(`Sale item ${item.saleItemId} not found`)
      if (item.quantity > saleItem.quantity) {
        throw new ValidationException([{ field: 'quantity', message: 'Return quantity exceeds sold quantity' }])
      }
    }

    // Generate return number
    const returnNumber = await this.generateReturnNumber()

    // Create return record
    const { data: ret, error: retError } = await supabaseAdmin
      .from('sale_returns')
      .insert({
        return_number: returnNumber,
        sale_id: input.saleId,
        reason: input.reason,
        notes: input.notes || null,
        created_by: userId,
      })
      .select()
      .single()

    if (retError) throw new Error(`Failed to create return: ${retError.message}`)

    // Add return items and restore inventory
    for (const item of input.items) {
      const { data: saleItem } = await supabaseAdmin
        .from('sale_items')
        .select('*')
        .eq('id', item.saleItemId)
        .single()

      // Create return item record
      await supabaseAdmin.from('sale_return_items').insert({
        sale_return_id: ret.id,
        sale_item_id: item.saleItemId,
        product_id: saleItem.product_id,
        batch_id: saleItem.batch_id,
        quantity: item.quantity,
        refund_amount: (saleItem.selling_price * item.quantity * (100 + saleItem.gst_percent)) / 100,
      })

      // Restore inventory (UNLESS damaged)
      if (input.reason !== 'DAMAGED') {
        await InventoryEngineService.recordMovement(
          {
            productId: saleItem.product_id,
            batchId: saleItem.batch_id,
            movementType: 'RETURN_FROM_PATIENT',
            quantityIn: item.quantity,
            referenceId: ret.id,
            referenceType: 'SALES_INVOICE',
            referenceNumber: `RET-${ret.return_number}`,
            remarks: `Return: ${input.reason}`,
          },
          userId,
        )
      } else {
        // Log as damaged (no inventory restoration)
        await InventoryEngineService.recordMovement(
          {
            productId: saleItem.product_id,
            batchId: saleItem.batch_id,
            movementType: 'DAMAGED',
            quantityOut: item.quantity,
            referenceId: ret.id,
            referenceType: 'SALES_INVOICE',
            referenceNumber: `RET-${ret.return_number}`,
            remarks: `Damaged return: ${input.reason}`,
          },
          userId,
        )
      }
    }

    return {
      returnNumber: ret.return_number,
      saleId: ret.sale_id,
      reason: ret.reason,
      createdAt: ret.created_at,
    }
  }

  private static async generateReturnNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('sale_returns')
      .select('return_number')
      .like('return_number', `RET-${year}-%`)
      .order('return_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].return_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `RET-${year}-${seq}`
  }
}
