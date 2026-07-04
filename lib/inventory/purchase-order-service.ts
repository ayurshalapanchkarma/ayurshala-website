/**
 * Purchase Order Service - Phase 4
 *
 * Status flow: draft → pending → approved → partially_received → received
 * Cancellation allowed from draft or pending only.
 *
 * PO number is auto-generated via fn_generate_po_number() RPC.
 */

import { createClient } from '@supabase/supabase-js'
import { ValidationError } from './validators'

// ── Types ─────────────────────────────────────────────────────────────────────

export type POStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export interface PurchaseOrder {
  uuid: string
  po_number: string
  supplier_uuid: string
  order_date: string
  expected_delivery_date?: string
  status: POStatus
  approved_by?: string
  approved_at?: string
  subtotal_amount: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  remarks?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  // joined
  supplier?: {
    uuid: string
    company_name: string
    supplier_code: string
    mobile?: string
    email?: string
  }
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  uuid: string
  purchase_order_uuid: string
  product_uuid: string
  ordered_quantity: number
  received_quantity: number
  unit_rate: number
  discount_percent: number
  gst_percentage: number
  line_amount: number
  created_at: string
  updated_at: string
  // joined
  product?: {
    uuid: string
    product_code: string
    product_name: string
    generic_name?: string
    unit?: { name: string; short_name: string }
  }
}

export interface CreatePOInput {
  supplier_uuid: string
  order_date?: string
  expected_delivery_date?: string
  remarks?: string
  items: CreatePOItemInput[]
}

export interface CreatePOItemInput {
  product_uuid: string
  ordered_quantity: number
  unit_rate: number
  discount_percent?: number
  gst_percentage?: number
}

export interface UpdatePOInput {
  supplier_uuid?: string
  order_date?: string
  expected_delivery_date?: string
  remarks?: string
  items?: CreatePOItemInput[]
}

export interface POListOptions {
  search?: string
  status?: POStatus | ''
  supplier_uuid?: string
  page?: number
  pageSize?: number
  sortBy?: 'po_number' | 'order_date' | 'total_amount' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── Supabase client (lazy) ─────────────────────────────────────────────────────

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase configuration missing')
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcLineAmount(
  qty: number,
  rate: number,
  discountPct: number,
  gstPct: number
): number {
  const base = qty * rate
  const afterDiscount = base - (base * discountPct) / 100
  const gst = (afterDiscount * gstPct) / 100
  return parseFloat((afterDiscount + gst).toFixed(2))
}

function calcPOTotals(items: CreatePOItemInput[]) {
  let subtotal = 0
  let taxAmount = 0
  let total = 0

  for (const item of items) {
    const qty = item.ordered_quantity
    const rate = item.unit_rate
    const disc = item.discount_percent ?? 0
    const gst = item.gst_percentage ?? 0

    const base = qty * rate
    const afterDisc = base - (base * disc) / 100
    const gstAmt = (afterDisc * gst) / 100

    subtotal += afterDisc
    taxAmount += gstAmt
    total += afterDisc + gstAmt
  }

  return {
    subtotal_amount: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(taxAmount.toFixed(2)),
    discount_amount: 0,
    total_amount: parseFloat(total.toFixed(2)),
  }
}

function validatePOInput(input: CreatePOInput): void {
  const errors: Record<string, string> = {}

  if (!input.supplier_uuid?.trim()) {
    errors.supplier_uuid = 'Supplier is required'
  }

  if (!input.items || input.items.length === 0) {
    errors.items = 'At least one item is required'
  } else {
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]
      if (!item.product_uuid?.trim()) {
        errors[`items[${i}].product_uuid`] = 'Product is required'
      }
      if (!item.ordered_quantity || item.ordered_quantity <= 0) {
        errors[`items[${i}].ordered_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unit_rate === undefined || item.unit_rate < 0) {
        errors[`items[${i}].unit_rate`] = 'Unit rate must be 0 or greater'
      }
    }
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
}

// ── Service ────────────────────────────────────────────────────────────────────

export class PurchaseOrderService {
  /**
   * List purchase orders with pagination, search, status filter, date range.
   */
  static async getPurchaseOrders(
    options: POListOptions = {}
  ): Promise<ListResponse<PurchaseOrder>> {
    const {
      search = '',
      status = '',
      supplier_uuid = '',
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = options

    try {
      let query = getSupabase()
        .from('inv_purchase_orders')
        .select(
          `
          *,
          supplier:inv_suppliers (
            uuid, company_name, supplier_code, mobile, email
          )
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)

      if (search.trim()) {
        query = query.or(`po_number.ilike.%${search}%,remarks.ilike.%${search}%`)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (supplier_uuid) {
        query = query.eq('supplier_uuid', supplier_uuid)
      }

      if (dateFrom) {
        query = query.gte('order_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('order_date', dateTo)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: data as PurchaseOrder[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error fetching purchase orders:', error)
      throw new Error('Failed to fetch purchase orders')
    }
  }

  /**
   * Get a single PO with all items and product details.
   */
  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_purchase_orders')
        .select(
          `
          *,
          supplier:inv_suppliers (
            uuid, company_name, supplier_code, mobile, email
          ),
          items:inv_purchase_order_items (
            *,
            product:inv_products (
              uuid, product_code, product_name, generic_name,
              unit:inv_units ( name, short_name )
            )
          )
        `
        )
        .eq('uuid', id)
        .single()

      if (error) throw error
      return data as PurchaseOrder
    } catch (error) {
      console.error('Error fetching PO:', error)
      throw new Error('Purchase order not found')
    }
  }

  /**
   * Create a new PO in draft status with auto-generated PO number.
   */
  static async createPurchaseOrder(
    input: CreatePOInput,
    userId?: string
  ): Promise<PurchaseOrder> {
    validatePOInput(input)

    try {
      // 1. Auto-generate PO number
      const { data: poNum, error: seqErr } = await getSupabase().rpc(
        'fn_generate_po_number'
      )
      if (seqErr) throw new Error('Failed to generate PO number')

      // 2. Calculate totals
      const totals = calcPOTotals(input.items)

      // 3. Insert PO header
      const { data: po, error: poErr } = await getSupabase()
        .from('inv_purchase_orders')
        .insert([
          {
            po_number: poNum,
            supplier_uuid: input.supplier_uuid,
            order_date: input.order_date ?? new Date().toISOString().split('T')[0],
            expected_delivery_date: input.expected_delivery_date ?? null,
            status: 'draft',
            ...totals,
            remarks: input.remarks ?? null,
            created_by: userId ?? null,
            updated_by: userId ?? null,
          } as any,
        ])
        .select()
        .single()

      if (poErr) throw poErr

      // 4. Insert line items
      const lineItems = input.items.map((item) => ({
        purchase_order_uuid: (po as any).uuid,
        product_uuid: item.product_uuid,
        ordered_quantity: item.ordered_quantity,
        received_quantity: 0,
        unit_rate: item.unit_rate,
        discount_percent: item.discount_percent ?? 0,
        gst_percentage: item.gst_percentage ?? 0,
        line_amount: calcLineAmount(
          item.ordered_quantity,
          item.unit_rate,
          item.discount_percent ?? 0,
          item.gst_percentage ?? 0
        ),
      }))

      const { error: itemErr } = await getSupabase()
        .from('inv_purchase_order_items')
        .insert(lineItems as any)

      if (itemErr) throw itemErr

      // 5. Return full PO with items
      return this.getPurchaseOrderById((po as any).uuid)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating PO:', error)
      throw new Error('Failed to create purchase order')
    }
  }

  /**
   * Update a PO (only allowed in draft status).
   */
  static async updatePurchaseOrder(
    id: string,
    input: UpdatePOInput,
    userId?: string
  ): Promise<PurchaseOrder> {
    try {
      // Verify exists and is draft
      const existing = await this.getPurchaseOrderById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({
          status: `Cannot edit a PO in '${existing.status}' status. Only draft POs can be edited.`,
        })
      }

      const updateData: Record<string, unknown> = {
        updated_by: userId ?? null,
        updated_at: new Date().toISOString(),
      }

      if (input.supplier_uuid) updateData.supplier_uuid = input.supplier_uuid
      if (input.order_date) updateData.order_date = input.order_date
      if (input.expected_delivery_date !== undefined)
        updateData.expected_delivery_date = input.expected_delivery_date
      if (input.remarks !== undefined) updateData.remarks = input.remarks

      // If items provided, replace all items and recalculate totals
      if (input.items && input.items.length > 0) {
        // Delete existing items
        await getSupabase()
          .from('inv_purchase_order_items')
          .delete()
          .eq('purchase_order_uuid', id)

        // Insert new items
        const lineItems = input.items.map((item) => ({
          purchase_order_uuid: id,
          product_uuid: item.product_uuid,
          ordered_quantity: item.ordered_quantity,
          received_quantity: 0,
          unit_rate: item.unit_rate,
          discount_percent: item.discount_percent ?? 0,
          gst_percentage: item.gst_percentage ?? 0,
          line_amount: calcLineAmount(
            item.ordered_quantity,
            item.unit_rate,
            item.discount_percent ?? 0,
            item.gst_percentage ?? 0
          ),
        }))

        const { error: itemErr } = await getSupabase()
          .from('inv_purchase_order_items')
          .insert(lineItems as any)
        if (itemErr) throw itemErr

        const totals = calcPOTotals(input.items)
        Object.assign(updateData, totals)
      }

      const { error } = await getSupabase()
        .from('inv_purchase_orders')
        .update(updateData as any)
        .eq('uuid', id)

      if (error) throw error

      return this.getPurchaseOrderById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating PO:', error)
      throw new Error('Failed to update purchase order')
    }
  }

  /**
   * Submit PO for approval (draft → pending).
   */
  static async submitForApproval(id: string, userId?: string): Promise<PurchaseOrder> {
    try {
      const existing = await this.getPurchaseOrderById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({
          status: `Only draft POs can be submitted. Current status: '${existing.status}'`,
        })
      }

      if (!existing.items || existing.items.length === 0) {
        throw new ValidationError({ items: 'Cannot submit a PO with no items' })
      }

      const { error } = await getSupabase()
        .from('inv_purchase_orders')
        .update({
          status: 'pending',
          updated_by: userId ?? null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('uuid', id)

      if (error) throw error
      return this.getPurchaseOrderById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error submitting PO:', error)
      throw new Error('Failed to submit purchase order')
    }
  }

  /**
   * Approve a PO (pending → approved).
   */
  static async approvePurchaseOrder(id: string, userId?: string): Promise<PurchaseOrder> {
    try {
      const existing = await this.getPurchaseOrderById(id)
      if (existing.status !== 'pending') {
        throw new ValidationError({
          status: `Only pending POs can be approved. Current status: '${existing.status}'`,
        })
      }

      const { error } = await getSupabase()
        .from('inv_purchase_orders')
        .update({
          status: 'approved',
          approved_by: userId ?? null,
          approved_at: new Date().toISOString(),
          updated_by: userId ?? null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('uuid', id)

      if (error) throw error
      return this.getPurchaseOrderById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error approving PO:', error)
      throw new Error('Failed to approve purchase order')
    }
  }

  /**
   * Cancel a PO (only draft or pending status allowed).
   */
  static async cancelPurchaseOrder(
    id: string,
    reason?: string,
    userId?: string
  ): Promise<PurchaseOrder> {
    try {
      const existing = await this.getPurchaseOrderById(id)
      if (!['draft', 'pending'].includes(existing.status)) {
        throw new ValidationError({
          status: `Cannot cancel a PO in '${existing.status}' status`,
        })
      }

      const { error } = await getSupabase()
        .from('inv_purchase_orders')
        .update({
          status: 'cancelled',
          remarks: reason
            ? `${existing.remarks ? existing.remarks + ' | ' : ''}CANCELLED: ${reason}`
            : existing.remarks,
          updated_by: userId ?? null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('uuid', id)

      if (error) throw error
      return this.getPurchaseOrderById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error cancelling PO:', error)
      throw new Error('Failed to cancel purchase order')
    }
  }

  /**
   * Get PO summary stats for dashboard.
   */
  static async getPOStats(): Promise<{
    draft: number
    pending: number
    approved: number
    partiallyReceived: number
    totalValuePending: number
  }> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_purchase_orders')
        .select('status, total_amount')
        .eq('is_active', true)
        .in('status', ['draft', 'pending', 'approved', 'partially_received'])

      if (error) throw error

      const rows = data as { status: string; total_amount: number }[]

      return {
        draft: rows.filter((r) => r.status === 'draft').length,
        pending: rows.filter((r) => r.status === 'pending').length,
        approved: rows.filter((r) => r.status === 'approved').length,
        partiallyReceived: rows.filter((r) => r.status === 'partially_received').length,
        totalValuePending: rows
          .filter((r) => ['pending', 'approved'].includes(r.status))
          .reduce((sum, r) => sum + (r.total_amount ?? 0), 0),
      }
    } catch (error) {
      console.error('Error fetching PO stats:', error)
      return {
        draft: 0,
        pending: 0,
        approved: 0,
        partiallyReceived: 0,
        totalValuePending: 0,
      }
    }
  }
}
