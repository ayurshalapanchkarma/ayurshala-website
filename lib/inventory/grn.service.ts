import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface GoodsReceivedNote {
  id: string
  grn_number: string
  purchase_order_id?: string
  supplier_id: string
  received_date: string
  received_by?: string
  supplier_invoice_no?: string
  supplier_invoice_date?: string
  status: 'DRAFT' | 'RECEIVED' | 'PARTIAL' | 'REJECTED' | 'POSTED'
  remarks?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreateGRNInput {
  purchase_order_id?: string
  supplier_id: string
  supplier_invoice_no?: string
  supplier_invoice_date?: string
  remarks?: string
}

export class GRNService {
  static async getGRNs(supplierId?: string, status?: string): Promise<GoodsReceivedNote[]> {
    let query = supabaseAdmin
      .from('goods_receipt_notes')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch GRNs: ${error.message}`)
    return data || []
  }

  static async getGRNById(id: string): Promise<GoodsReceivedNote> {
    const { data, error } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`GRN not found: ${error.message}`)
    if (!data) throw new Error('GRN not found')
    return data
  }

  static async createGRN(input: CreateGRNInput, userId: string): Promise<GoodsReceivedNote> {
    if (!input.supplier_id?.trim()) {
      throw new ValidationException([{ field: 'supplier_id', message: 'Supplier is required' }])
    }

    // Verify supplier exists
    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', input.supplier_id)
      .eq('is_deleted', false)
      .single()

    if (!supplier) throw new Error('Supplier not found')

    const grnNumber = await this.generateGRNNumber()

    const { data, error } = await supabaseAdmin
      .from('goods_receipt_notes')
      .insert({
        grn_number: grnNumber,
        purchase_order_id: input.purchase_order_id || null,
        supplier_id: input.supplier_id,
        supplier_invoice_no: input.supplier_invoice_no || null,
        supplier_invoice_date: input.supplier_invoice_date || null,
        remarks: input.remarks || null,
        received_by: userId,
        status: 'DRAFT',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create GRN: ${error.message}`)
    if (!data) throw new Error('Failed to create GRN')
    return data
  }

  static async postGRN(id: string): Promise<GoodsReceivedNote> {
    const grn = await this.getGRNById(id)

    if (grn.status === 'POSTED') {
      throw new ValidationException([{ field: 'status', message: 'GRN already posted' }])
    }

    const { data, error } = await supabaseAdmin
      .from('goods_receipt_notes')
      .update({ status: 'POSTED' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to post GRN: ${error.message}`)
    if (!data) throw new Error('Failed to post GRN')
    return data
  }

  private static async generateGRNNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('goods_receipt_notes')
      .select('grn_number')
      .like('grn_number', `GRN-${year}-%`)
      .order('grn_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].grn_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `GRN-${year}-${seq}`
  }
}
