/**
 * GRN Service — Phase 4
 *
 * Goods Receipt Note workflow:
 *   1. Create GRN (draft) against a PO or standalone
 *   2. Add GRN items with batch numbers, expiry dates, pricing
 *   3. POST the GRN — calls fn_post_grn() which atomically:
 *      - Creates/updates inv_product_batches
 *      - Creates inv_stock_movements (PURCHASE type)
 *      - Updates PO item received_quantity
 *      - Updates PO status (partially_received / received)
 *      - Maintains batch available_quantity via trigger
 *
 * Cancellation: only draft GRNs can be cancelled.
 * A posted GRN is permanent — corrections go via stock adjustment.
 */

import { createClient } from '@supabase/supabase-js'
import { ValidationError } from './validators'

// ── Types ─────────────────────────────────────────────────────────────────────

export type GRNStatus = 'draft' | 'posted' | 'cancelled'

export interface GoodsReceipt {
  uuid: string
  grn_number: string
  purchase_order_uuid?: string
  supplier_uuid: string
  invoice_number?: string
  invoice_date?: string
  received_date: string
  received_by?: string
  status: GRNStatus
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
  }
  purchase_order?: {
    uuid: string
    po_number: string
    status: string
  }
  items?: GRNItem[]
}

export interface GRNItem {
  uuid: string
  grn_uuid: string
  product_uuid: string
  po_item_uuid?: string
  batch_number: string
  manufacturing_date?: string
  expiry_date?: string
  mrp: number
  purchase_price: number
  selling_price: number
  received_quantity: number
  free_quantity: number
  discount_percent: number
  gst_percentage: number
  line_amount: number
  created_at: string
  // joined
  product?: {
    uuid: string
    product_code: string
    product_name: string
    generic_name?: string
    batch_tracking: boolean
    expiry_tracking: boolean
    unit?: { name: string; short_name: string }
  }
}

export interface CreateGRNInput {
  purchase_order_uuid?: string
  supplier_uuid: string
  invoice_number?: string
  invoice_date?: string
  received_date?: string
  remarks?: string
  items: CreateGRNItemInput[]
}

export interface CreateGRNItemInput {
  product_uuid: string
  po_item_uuid?: string
  batch_number: string
  manufacturing_date?: string
  expiry_date?: string
  mrp: number
  purchase_price: number
  selling_price: number
  received_quantity: number
  free_quantity?: number
  discount_percent?: number
  gst_percentage?: number
}

export interface UpdateGRNInput {
  supplier_uuid?: string
  invoice_number?: string
  invoice_date?: string
  received_date?: string
  remarks?: string
  items?: CreateGRNItemInput[]
}

export interface GRNListOptions {
  search?: string
  status?: GRNStatus | ''
  supplier_uuid?: string
  purchase_order_uuid?: string
  page?: number
  pageSize?: number
  sortBy?: 'grn_number' | 'received_date' | 'total_amount' | 'created_at'
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

function calcGRNLineAmount(
  qty: number,
  freeQty: number,
  purchasePrice: number,
  discountPct: number,
  gstPct: number
): number {
  const billableQty = qty // free quantity doesn't affect billed amount
  const base = billableQty * purchasePrice
  const afterDisc = base - (base * discountPct) / 100
  const gst = (afterDisc * gstPct) / 100
  return parseFloat((afterDisc + gst).toFixed(2))
}

function calcGRNTotal(items: CreateGRNItemInput[]): number {
  return parseFloat(
    items
      .reduce(
        (sum, item) =>
          sum +
          calcGRNLineAmount(
            item.received_quantity,
            item.free_quantity ?? 0,
            item.purchase_price,
            item.discount_percent ?? 0,
            item.gst_percentage ?? 0
          ),
        0
      )
      .toFixed(2)
  )
}

function validateGRNInput(input: CreateGRNInput): void {
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
      if (!item.batch_number?.trim()) {
        errors[`items[${i}].batch_number`] = 'Batch number is required'
      }
      if (!item.received_quantity || item.received_quantity <= 0) {
        errors[`items[${i}].received_quantity`] = 'Received quantity must be greater than 0'
      }
      if (item.purchase_price < 0) {
        errors[`items[${i}].purchase_price`] = 'Purchase price cannot be negative'
      }
      if (item.mrp < 0) {
        errors[`items[${i}].mrp`] = 'MRP cannot be negative'
      }
    }
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
}

// ── Service ────────────────────────────────────────────────────────────────────

export class GRNService {
  /**
   * List GRNs with pagination, search, status filter.
   */
  static async getGRNs(options: GRNListOptions = {}): Promise<ListResponse<GoodsReceipt>> {
    const {
      search = '',
      status = '',
      supplier_uuid = '',
      purchase_order_uuid = '',
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = options

    try {
      let query = getSupabase()
        .from('inv_goods_receipts')
        .select(
          `
          *,
          supplier:inv_suppliers (
            uuid, company_name, supplier_code
          ),
          purchase_order:inv_purchase_orders (
            uuid, po_number, status
          )
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)

      if (search.trim()) {
        query = query.or(
          `grn_number.ilike.%${search}%,invoice_number.ilike.%${search}%`
        )
      }

      if (status) query = query.eq('status', status)
      if (supplier_uuid) query = query.eq('supplier_uuid', supplier_uuid)
      if (purchase_order_uuid)
        query = query.eq('purchase_order_uuid', purchase_order_uuid)
      if (dateFrom) query = query.gte('received_date', dateFrom)
      if (dateTo) query = query.lte('received_date', dateTo)

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: data as GoodsReceipt[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error fetching GRNs:', error)
      throw new Error('Failed to fetch GRNs')
    }
  }

  /**
   * Get a single GRN with all items and product details.
   */
  static async getGRNById(id: string): Promise<GoodsReceipt> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_goods_receipts')
        .select(
          `
          *,
          supplier:inv_suppliers (
            uuid, company_name, supplier_code
          ),
          purchase_order:inv_purchase_orders (
            uuid, po_number, status
          ),
          items:inv_goods_receipt_items (
            *,
            product:inv_products (
              uuid, product_code, product_name, generic_name,
              batch_tracking, expiry_tracking,
              unit:inv_units ( name, short_name )
            )
          )
        `
        )
        .eq('uuid', id)
        .single()

      if (error) throw error
      return data as GoodsReceipt
    } catch (error) {
      console.error('Error fetching GRN:', error)
      throw new Error('GRN not found')
    }
  }

  /**
   * Create a new GRN in draft status with auto-generated GRN number.
   */
  static async createGRN(input: CreateGRNInput, userId?: string): Promise<GoodsReceipt> {
    validateGRNInput(input)

    try {
      // 1. Generate GRN number
      const { data: grnNum, error: seqErr } = await getSupabase().rpc(
        'fn_generate_grn_number'
      )
      if (seqErr) throw new Error('Failed to generate GRN number')

      const totalAmount = calcGRNTotal(input.items)

      // 2. Insert GRN header
      const { data: grn, error: grnErr } = await getSupabase()
        .from('inv_goods_receipts')
        .insert([
          {
            grn_number: grnNum,
            purchase_order_uuid: input.purchase_order_uuid ?? null,
            supplier_uuid: input.supplier_uuid,
            invoice_number: input.invoice_number ?? null,
            invoice_date: input.invoice_date ?? null,
            received_date:
              input.received_date ?? new Date().toISOString().split('T')[0],
            status: 'draft',
            total_amount: totalAmount,
            remarks: input.remarks ?? null,
            created_by: userId ?? null,
            updated_by: userId ?? null,
          } as any,
        ])
        .select()
        .single()

      if (grnErr) throw grnErr

      // 3. Insert GRN items
      const grnUuid = (grn as any).uuid
      const lineItems = input.items.map((item) => ({
        grn_uuid: grnUuid,
        product_uuid: item.product_uuid,
        po_item_uuid: item.po_item_uuid ?? null,
        batch_number: item.batch_number.trim(),
        manufacturing_date: item.manufacturing_date ?? null,
        expiry_date: item.expiry_date ?? null,
        mrp: item.mrp,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        received_quantity: item.received_quantity,
        free_quantity: item.free_quantity ?? 0,
        discount_percent: item.discount_percent ?? 0,
        gst_percentage: item.gst_percentage ?? 0,
        line_amount: calcGRNLineAmount(
          item.received_quantity,
          item.free_quantity ?? 0,
          item.purchase_price,
          item.discount_percent ?? 0,
          item.gst_percentage ?? 0
        ),
      }))

      const { error: itemErr } = await getSupabase()
        .from('inv_goods_receipt_items')
        .insert(lineItems as any)

      if (itemErr) throw itemErr

      return this.getGRNById(grnUuid)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating GRN:', error)
      throw new Error('Failed to create GRN')
    }
  }

  /**
   * Update a GRN (only allowed in draft status).
   */
  static async updateGRN(
    id: string,
    input: UpdateGRNInput,
    userId?: string
  ): Promise<GoodsReceipt> {
    try {
      const existing = await this.getGRNById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({
          status: `Cannot edit a GRN in '${existing.status}' status`,
        })
      }

      const updateData: Record<string, unknown> = {
        updated_by: userId ?? null,
        updated_at: new Date().toISOString(),
      }

      if (input.supplier_uuid) updateData.supplier_uuid = input.supplier_uuid
      if (input.invoice_number !== undefined)
        updateData.invoice_number = input.invoice_number
      if (input.invoice_date !== undefined) updateData.invoice_date = input.invoice_date
      if (input.received_date) updateData.received_date = input.received_date
      if (input.remarks !== undefined) updateData.remarks = input.remarks

      if (input.items && input.items.length > 0) {
        // Replace items
        await getSupabase()
          .from('inv_goods_receipt_items')
          .delete()
          .eq('grn_uuid', id)

        const lineItems = input.items.map((item) => ({
          grn_uuid: id,
          product_uuid: item.product_uuid,
          po_item_uuid: item.po_item_uuid ?? null,
          batch_number: item.batch_number.trim(),
          manufacturing_date: item.manufacturing_date ?? null,
          expiry_date: item.expiry_date ?? null,
          mrp: item.mrp,
          purchase_price: item.purchase_price,
          selling_price: item.selling_price,
          received_quantity: item.received_quantity,
          free_quantity: item.free_quantity ?? 0,
          discount_percent: item.discount_percent ?? 0,
          gst_percentage: item.gst_percentage ?? 0,
          line_amount: calcGRNLineAmount(
            item.received_quantity,
            item.free_quantity ?? 0,
            item.purchase_price,
            item.discount_percent ?? 0,
            item.gst_percentage ?? 0
          ),
        }))

        const { error: itemErr } = await getSupabase()
          .from('inv_goods_receipt_items')
          .insert(lineItems as any)
        if (itemErr) throw itemErr

        updateData.total_amount = calcGRNTotal(input.items)
      }

      const { error } = await getSupabase()
        .from('inv_goods_receipts')
        .update(updateData as any)
        .eq('uuid', id)

      if (error) throw error
      return this.getGRNById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating GRN:', error)
      throw new Error('Failed to update GRN')
    }
  }

  /**
   * POST a GRN — delegates to fn_post_grn() Postgres function.
   *
   * This is the critical atomic operation:
   * - Creates/updates batches
   * - Creates stock movements
   * - Updates PO received quantities
   * - Updates PO status
   * - All in ONE database transaction
   */
  static async postGRN(id: string, userId?: string): Promise<GoodsReceipt> {
    try {
      const existing = await this.getGRNById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({
          status: `Only draft GRNs can be posted. Current status: '${existing.status}'`,
        })
      }

      if (!existing.items || existing.items.length === 0) {
        throw new ValidationError({ items: 'Cannot post a GRN with no items' })
      }

      // Call the atomic Postgres function
      const { data, error } = await getSupabase().rpc('fn_post_grn', {
        p_grn_uuid: id,
        p_user_uuid: userId ?? null,
      })

      if (error) throw error

      const result = data as {
        success: boolean
        grn_number: string
        items_processed: number
        movements_created: number
        error?: string
      }

      if (!result.success) {
        throw new Error(result.error ?? 'GRN posting failed')
      }

      return this.getGRNById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error posting GRN:', error)
      throw new Error('Failed to post GRN')
    }
  }

  /**
   * Cancel a GRN (only draft status).
   */
  static async cancelGRN(id: string, userId?: string): Promise<GoodsReceipt> {
    try {
      const existing = await this.getGRNById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({
          status: `Only draft GRNs can be cancelled. Current status: '${existing.status}'`,
        })
      }

      const { error } = await getSupabase()
        .from('inv_goods_receipts')
        .update({
          status: 'cancelled',
          updated_by: userId ?? null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('uuid', id)

      if (error) throw error
      return this.getGRNById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error cancelling GRN:', error)
      throw new Error('Failed to cancel GRN')
    }
  }

  /**
   * Load PO items for pre-filling a GRN (when creating GRN against a PO).
   * Returns only items with unreceived quantity.
   */
  static async getPOItemsForGRN(
    poUuid: string
  ): Promise<
    Array<{
      po_item_uuid: string
      product_uuid: string
      product_code: string
      product_name: string
      ordered_quantity: number
      received_quantity: number
      pending_quantity: number
      unit_rate: number
      gst_percentage: number
    }>
  > {
    try {
      const { data, error } = await getSupabase()
        .from('inv_purchase_order_items')
        .select(
          `
          uuid,
          product_uuid,
          ordered_quantity,
          received_quantity,
          unit_rate,
          gst_percentage,
          product:inv_products ( product_code, product_name )
        `
        )
        .eq('purchase_order_uuid', poUuid)

      if (error) throw error

      return (data as any[])
        .filter((item) => item.received_quantity < item.ordered_quantity * 1.05)
        .map((item) => ({
          po_item_uuid: item.uuid,
          product_uuid: item.product_uuid,
          product_code: item.product?.product_code ?? '',
          product_name: item.product?.product_name ?? '',
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity,
          pending_quantity: parseFloat(
            (item.ordered_quantity - item.received_quantity).toFixed(2)
          ),
          unit_rate: item.unit_rate,
          gst_percentage: item.gst_percentage,
        }))
    } catch (error) {
      console.error('Error fetching PO items for GRN:', error)
      throw new Error('Failed to load PO items')
    }
  }

  /**
   * GRN summary stats for dashboard.
   */
  static async getGRNStats(): Promise<{
    draft: number
    posted: number
    totalPostedToday: number
    totalPostedThisMonth: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const firstOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split('T')[0]

      const { data, error } = await getSupabase()
        .from('inv_goods_receipts')
        .select('status, received_date, total_amount')
        .eq('is_active', true)

      if (error) throw error

      const rows = data as {
        status: string
        received_date: string
        total_amount: number
      }[]

      return {
        draft: rows.filter((r) => r.status === 'draft').length,
        posted: rows.filter((r) => r.status === 'posted').length,
        totalPostedToday: rows
          .filter((r) => r.status === 'posted' && r.received_date === today)
          .reduce((s, r) => s + (r.total_amount ?? 0), 0),
        totalPostedThisMonth: rows
          .filter((r) => r.status === 'posted' && r.received_date >= firstOfMonth)
          .reduce((s, r) => s + (r.total_amount ?? 0), 0),
      }
    } catch (error) {
      console.error('Error fetching GRN stats:', error)
      return { draft: 0, posted: 0, totalPostedToday: 0, totalPostedThisMonth: 0 }
    }
  }
}
