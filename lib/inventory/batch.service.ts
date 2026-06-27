import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface Batch {
  id: string
  batch_number: string
  product_id: string
  goods_receipt_item_id?: string
  mfg_date?: string
  exp_date: string
  initial_quantity: number
  current_quantity: number
  purchase_price: number
  mrp?: number
  selling_price?: number
  status: 'ACTIVE' | 'LOW_STOCK' | 'EXPIRED' | 'DEPLETED' | 'BLOCKED'
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateBatchInput {
  batch_number: string
  product_id: string
  goods_receipt_item_id?: string
  mfg_date?: string
  exp_date: string
  initial_quantity: number
  purchase_price: number
  mrp?: number
  selling_price?: number
}

export class BatchService {
  static async getBatches(productId?: string, includeExpired = false): Promise<Batch[]> {
    let query = supabaseAdmin
      .from('inventory_batches')
      .select('*')
      .eq('is_deleted', false)
      .order('exp_date')

    if (productId) query = query.eq('product_id', productId)
    if (!includeExpired) query = query.neq('status', 'EXPIRED')

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch batches: ${error.message}`)
    return data || []
  }

  static async getBatchById(id: string): Promise<Batch> {
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Batch not found: ${error.message}`)
    if (!data) throw new Error('Batch not found')
    return data
  }

  static async createBatch(input: CreateBatchInput): Promise<Batch> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.batch_number?.trim()) errors.push({ field: 'batch_number', message: 'Batch number required' })
    if (!input.product_id?.trim()) errors.push({ field: 'product_id', message: 'Product required' })
    if (!input.exp_date) errors.push({ field: 'exp_date', message: 'Expiry date required' })
    if (input.initial_quantity <= 0) errors.push({ field: 'initial_quantity', message: 'Quantity must be > 0' })
    if (input.purchase_price < 0) errors.push({ field: 'purchase_price', message: 'Price cannot be negative' })

    if (errors.length > 0) throw new ValidationException(errors)

    // Validate expiry > mfg date
    if (input.mfg_date && new Date(input.exp_date) <= new Date(input.mfg_date)) {
      throw new ValidationException([{ field: 'exp_date', message: 'Expiry date must be after manufacturing date' }])
    }

    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .insert({
        batch_number: input.batch_number.trim(),
        product_id: input.product_id,
        goods_receipt_item_id: input.goods_receipt_item_id || null,
        mfg_date: input.mfg_date || null,
        exp_date: input.exp_date,
        initial_quantity: input.initial_quantity,
        current_quantity: input.initial_quantity,
        purchase_price: input.purchase_price,
        mrp: input.mrp || null,
        selling_price: input.selling_price || null,
        status: 'ACTIVE',
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        throw new ValidationException([{ field: 'batch_number', message: 'Batch number already exists for this product' }])
      }
      throw new Error(`Failed to create batch: ${error.message}`)
    }

    if (!data) throw new Error('Failed to create batch')
    return data
  }

  static async updateBatchQuantity(id: string, quantityChange: number): Promise<Batch> {
    const batch = await this.getBatchById(id)
    const newQuantity = batch.current_quantity + quantityChange

    if (newQuantity < 0) {
      throw new ValidationException([{ field: 'quantity', message: 'Insufficient quantity in batch' }])
    }

    // Determine status
    let status = batch.status
    if (newQuantity === 0) status = 'DEPLETED'
    else if (newQuantity > 0 && newQuantity <= batch.initial_quantity * 0.1) status = 'LOW_STOCK'
    else status = 'ACTIVE'

    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .update({ current_quantity: newQuantity, status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update batch: ${error.message}`)
    if (!data) throw new Error('Failed to update batch')
    return data
  }

  static async checkExpiredBatches(): Promise<string[]> {
    const now = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .update({ status: 'EXPIRED' })
      .eq('is_deleted', false)
      .lt('exp_date', now)
      .neq('status', 'EXPIRED')
      .select('id')

    if (error) throw new Error(`Failed to check expired batches: ${error.message}`)
    return data?.map(b => b.id) || []
  }
}
