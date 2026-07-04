/**
 * Pharmacy Return Service — Phase 5
 * Handles medicine returns, refunds, and stock restoration
 */

import { createClient } from '@supabase/supabase-js'

export interface BillReturn {
  uuid: string
  return_number: string
  original_bill_uuid: string
  patient_uuid?: string
  return_date: string
  return_time: string
  return_type: 'FULL' | 'PARTIAL' | 'DAMAGED' | 'EXPIRED'
  reason?: string
  total_return_amount: number
  refund_amount: number
  refund_mode?: string
  return_status: string
  approved_by?: string
  approved_at?: string
  created_at: string
  items?: ReturnItem[]
}

export interface ReturnItem {
  uuid: string
  return_uuid: string
  bill_item_uuid?: string
  product_uuid: string
  batch_uuid?: string
  quantity_returned: number
  reason?: string
  refund_value: number
}

export interface CreateReturnInput {
  original_bill_uuid: string
  return_type: 'FULL' | 'PARTIAL' | 'DAMAGED' | 'EXPIRED'
  reason?: string
  items: CreateReturnItemInput[]
  refund_mode?: string
}

export interface CreateReturnItemInput {
  bill_item_uuid?: string
  product_uuid: string
  batch_uuid?: string
  quantity_returned: number
  reason?: string
  refund_value: number
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export class PharmacyReturnService {
  /**
   * Get all returns
   */
  static async getReturns(options: {
    page?: number
    pageSize?: number
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<any> {
    const {
      page = 1,
      pageSize = 50,
      dateFrom = '',
      dateTo = '',
    } = options

    try {
      let query = getSupabase()
        .from('ph_bill_returns')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)

      if (dateFrom) {
        query = query.gte('return_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('return_date', dateTo)
      }

      query = query.order('return_date', { ascending: false })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as BillReturn[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
      throw new Error('Failed to fetch returns')
    }
  }

  /**
   * Get single return with items
   */
  static async getReturnById(id: string): Promise<BillReturn> {
    try {
      const { data: billReturn, error: returnError } = await getSupabase()
        .from('ph_bill_returns')
        .select('*')
        .eq('uuid', id)
        .eq('is_deleted', false)
        .single()

      if (returnError) throw returnError

      // Get items
      const { data: items, error: itemsError } = await getSupabase()
        .from('ph_bill_return_items')
        .select('*')
        .eq('return_uuid', id)

      if (itemsError) throw itemsError

      return {
        ...(billReturn as BillReturn),
        items: items as ReturnItem[],
      }
    } catch (error) {
      console.error('Error fetching return:', error)
      throw new Error('Failed to fetch return')
    }
  }

  /**
   * Create a return (DRAFT status)
   */
  static async createReturn(input: CreateReturnInput, userId?: string): Promise<BillReturn> {
    try {
      // Generate return number
      const { data: returnNumber, error: numberError } = await getSupabase()
        .rpc('fn_generate_return_number')

      if (numberError) throw numberError

      // Calculate totals
      const totalReturnAmount = input.items.reduce((sum, item) => sum + (item.refund_value || 0), 0)

      // Create return
      const { data: billReturn, error: returnError } = await getSupabase()
        .from('ph_bill_returns')
        .insert([
          {
            return_number: returnNumber,
            original_bill_uuid: input.original_bill_uuid,
            return_type: input.return_type,
            reason: input.reason,
            total_return_amount: totalReturnAmount,
            refund_amount: totalReturnAmount,
            refund_mode: input.refund_mode,
            return_status: 'DRAFT',
            created_by: userId,
          },
        ])
        .select()
        .single()

      if (returnError) throw returnError

      // Insert items
      const itemsWithReturnId = input.items.map((item) => ({
        return_uuid: billReturn.uuid,
        bill_item_uuid: item.bill_item_uuid || null,
        product_uuid: item.product_uuid,
        batch_uuid: item.batch_uuid || null,
        quantity_returned: item.quantity_returned,
        reason: item.reason,
        refund_value: item.refund_value,
      }))

      const { error: itemsError } = await getSupabase()
        .from('ph_bill_return_items')
        .insert(itemsWithReturnId)

      if (itemsError) throw itemsError

      return this.getReturnById(billReturn.uuid)
    } catch (error) {
      console.error('Error creating return:', error)
      throw new Error('Failed to create return')
    }
  }

  /**
   * Post/approve a return — atomically restores stock
   */
  static async postReturn(returnId: string, userId?: string): Promise<BillReturn> {
    try {
      // Call atomic RPC function
      const { data, error } = await getSupabase().rpc('fn_post_return', {
        p_return_uuid: returnId,
        p_user_uuid: userId || null,
      })

      if (error) throw error

      const result = data as {
        success: boolean
        return_number: string
        items_restored: number
        refund_amount: number
      }

      if (!result.success) {
        throw new Error('Failed to process return')
      }

      return this.getReturnById(returnId)
    } catch (error) {
      console.error('Error posting return:', error)
      throw new Error('Failed to process return')
    }
  }

  /**
   * Cancel a return (only DRAFT status)
   */
  static async cancelReturn(returnId: string, userId?: string): Promise<void> {
    try {
      const billReturn = await this.getReturnById(returnId)

      if (billReturn.return_status !== 'DRAFT') {
        throw new Error('Can only cancel draft returns')
      }

      await getSupabase()
        .from('ph_bill_returns')
        .update({
          return_status: 'CANCELLED',
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('uuid', returnId)
    } catch (error) {
      console.error('Error cancelling return:', error)
      throw new Error('Failed to cancel return')
    }
  }
}
