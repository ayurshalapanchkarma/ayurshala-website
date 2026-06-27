import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  expected_delivery_date?: string
  invoice_number?: string
  invoice_date?: string
  gst_amount: number
  discount_amount: number
  shipping_amount: number
  total_amount: number
  notes?: string
  created_by: string
  approved_by?: string
  approved_at?: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CreatePurchaseOrderInput {
  supplier_id: string
  expected_delivery_date?: string
  invoice_number?: string
  invoice_date?: string
  gst_amount?: number
  discount_amount?: number
  shipping_amount?: number
  notes?: string
}

export class PurchaseOrderService {
  static async getPurchaseOrders(supplierId?: string, status?: string): Promise<PurchaseOrder[]> {
    let query = supabaseAdmin
      .from('purchase_orders')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch POs: ${error.message}`)
    return data || []
  }

  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`PO not found: ${error.message}`)
    if (!data) throw new Error('PO not found')
    return data
  }

  static async createPurchaseOrder(input: CreatePurchaseOrderInput, userId: string): Promise<PurchaseOrder> {
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

    // Generate PO number
    const poNumber = await this.generatePONumber()

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: input.supplier_id,
        expected_delivery_date: input.expected_delivery_date || null,
        invoice_number: input.invoice_number || null,
        invoice_date: input.invoice_date || null,
        gst_amount: input.gst_amount ?? 0,
        discount_amount: input.discount_amount ?? 0,
        shipping_amount: input.shipping_amount ?? 0,
        total_amount: 0,
        notes: input.notes || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create PO: ${error.message}`)
    if (!data) throw new Error('Failed to create PO')
    return data
  }

  static async approvePurchaseOrder(id: string, userId: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id)

    if (po.status !== 'PENDING_APPROVAL' && po.status !== 'DRAFT') {
      throw new ValidationException([{ field: 'status', message: 'Only DRAFT or PENDING POs can be approved' }])
    }

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: 'APPROVED',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to approve PO: ${error.message}`)
    if (!data) throw new Error('Failed to approve PO')
    return data
  }

  static async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id)

    if (po.status === 'RECEIVED') {
      throw new ValidationException([{ field: 'status', message: 'Cannot cancel a received PO' }])
    }

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .update({ status: 'CANCELLED' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to cancel PO: ${error.message}`)
    if (!data) throw new Error('Failed to cancel PO')
    return data
  }

  private static async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('purchase_orders')
      .select('po_number')
      .like('po_number', `PO-${year}-%`)
      .order('po_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].po_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `PO-${year}-${seq}`
  }
}
