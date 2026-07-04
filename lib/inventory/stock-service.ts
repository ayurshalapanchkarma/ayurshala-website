/**
 * Stock Service — Phase 4
 * Handles current stock, batch management, stock adjustments
 */

import { createClient } from '@supabase/supabase-js'
import { ValidationError } from './validators'

// Types
export interface CurrentStock {
  product_uuid: string
  product_code: string
  product_name: string
  generic_name?: string
  category?: string
  unit_name?: string
  unit_short?: string
  current_stock: number
  reorder_level: number
  min_stock: number
  is_low_stock: boolean
  batches_count: number
}

export interface ProductBatch {
  uuid: string
  product_uuid: string
  batch_number: string
  manufacturing_date?: string
  expiry_date?: string
  purchase_price: number
  mrp: number
  selling_price: number
  received_quantity: number
  available_quantity: number
  supplier_uuid?: string
  grn_uuid?: string
  status: 'good' | 'quarantine' | 'expired' | 'damaged'
  is_active: boolean
  created_at: string
  updated_at: string
  product?: { product_name: string; product_code: string }
  supplier?: { company_name: string }
  days_to_expiry?: number
  is_expired?: boolean
  is_expiring_soon?: boolean
}

export type AdjustmentReason = 'PHYSICAL_COUNT' | 'DAMAGE' | 'EXPIRED' | 'LOST' | 'CORRECTION'

export interface StockAdjustment {
  uuid: string
  adjustment_number: string
  adjustment_date: string
  reason: AdjustmentReason
  notes?: string
  status: 'draft' | 'approved' | 'cancelled'
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  items?: StockAdjustmentItem[]
}

export interface StockAdjustmentItem {
  uuid: string
  adjustment_uuid: string
  product_uuid: string
  batch_uuid: string
  adjustment_type: 'INCREASE' | 'DECREASE'
  quantity: number
  notes?: string
  product?: { product_code: string; product_name: string }
  batch?: { batch_number: string; available_quantity: number }
}

export interface StockMovement {
  uuid: string
  product_uuid: string
  batch_uuid?: string
  movement_type: string
  quantity: number
  before_stock: number
  after_stock: number
  reference_type?: string
  reference_uuid?: string
  remarks?: string
  created_at: string
  created_by?: string
  product?: { product_code: string; product_name: string }
  batch?: { batch_number: string }
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

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

export class StockService {
  static async getCurrentStock(options: {
    search?: string
    category_uuid?: string
    low_stock_only?: boolean
    page?: number
    pageSize?: number
  } = {}): Promise<ListResponse<CurrentStock>> {
    const { search = '', category_uuid = '', low_stock_only = false, page = 1, pageSize = 50 } = options

    try {
      let query = getSupabase()
        .from('inv_products')
        .select(`
          uuid, product_code, product_name, generic_name, reorder_level, min_stock, is_active,
          category:inv_categories(name),
          unit:inv_units(name, short_name)
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('is_deleted', false)

      if (search.trim()) {
        query = query.or(`product_name.ilike.%${search}%,product_code.ilike.%${search}%`)
      }

      if (category_uuid) {
        query = query.eq('category_uuid', category_uuid)
      }

      query = query.order('product_name', { ascending: true })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      const stockRows = await Promise.all(
        (data as any[]).map(async (product) => {
          const { data: stockQty } = await getSupabase()
            .rpc('fn_get_product_stock', { p_product_uuid: product.uuid })

          const { count: batchCount } = await getSupabase()
            .from('inv_product_batches')
            .select('uuid', { count: 'exact', head: true })
            .eq('product_uuid', product.uuid)
            .eq('status', 'good')
            .eq('is_active', true)
            .gt('available_quantity', 0)

          const currentStock = stockQty ?? 0
          const isLowStock = currentStock <= (product.reorder_level ?? 0)

          return {
            product_uuid: product.uuid,
            product_code: product.product_code,
            product_name: product.product_name,
            generic_name: product.generic_name,
            category: product.category?.name,
            unit_name: product.unit?.name,
            unit_short: product.unit?.short_name,
            current_stock: currentStock,
            reorder_level: product.reorder_level ?? 0,
            min_stock: product.min_stock ?? 0,
            is_low_stock: isLowStock,
            batches_count: batchCount ?? 0,
          } as CurrentStock
        })
      )

      const filtered = low_stock_only ? stockRows.filter(r => r.is_low_stock) : stockRows

      return {
        data: filtered,
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error fetching current stock:', error)
      throw new Error('Failed to fetch current stock')
    }
  }

  static async getProductStock(productUuid: string): Promise<number> {
    try {
      const { data, error } = await getSupabase()
        .rpc('fn_get_product_stock', { p_product_uuid: productUuid })
      if (error) throw error
      return data ?? 0
    } catch (error) {
      console.error('Error fetching product stock:', error)
      throw new Error('Failed to fetch product stock')
    }
  }

  static async getProductBatches(productUuid: string): Promise<ProductBatch[]> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_product_batches')
        .select(`
          *, 
          product:inv_products(product_name, product_code),
          supplier:inv_suppliers(company_name)
        `)
        .eq('product_uuid', productUuid)
        .eq('is_active', true)
        .order('expiry_date', { ascending: true, nullsFirst: false })

      if (error) throw error

      const today = new Date()
      return (data as any[]).map(batch => {
        let daysToExpiry: number | undefined
        let isExpired = false
        let isExpiringSoon = false

        if (batch.expiry_date) {
          const expiry = new Date(batch.expiry_date)
          daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          isExpired = daysToExpiry < 0
          isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 90
        }

        return {
          ...batch,
          days_to_expiry: daysToExpiry,
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon,
        } as ProductBatch
      })
    } catch (error) {
      console.error('Error fetching product batches:', error)
      throw new Error('Failed to fetch product batches')
    }
  }

  static async getAllBatches(options: {
    search?: string
    status?: string
    expiring_soon?: boolean
    page?: number
    pageSize?: number
  } = {}): Promise<ListResponse<ProductBatch>> {
    const { search = '', status = '', expiring_soon = false, page = 1, pageSize = 50 } = options

    try {
      let query = getSupabase()
        .from('inv_product_batches')
        .select(`
          *, 
          product:inv_products(product_name, product_code, category:inv_categories(name)),
          supplier:inv_suppliers(company_name)
        `, { count: 'exact' })
        .eq('is_active', true)

      if (search.trim()) {
        query = query.or(`batch_number.ilike.%${search}%,product.product_name.ilike.%${search}%`)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (expiring_soon) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 90)
        const futureDateStr = futureDate.toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('expiry_date', today).lte('expiry_date', futureDateStr)
      }

      query = query.order('expiry_date', { ascending: true })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      const today = new Date()
      const enrichedData = (data as any[]).map(batch => {
        let daysToExpiry: number | undefined
        let isExpired = false
        let isExpiringSoon = false

        if (batch.expiry_date) {
          const expiry = new Date(batch.expiry_date)
          daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          isExpired = daysToExpiry < 0
          isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 90
        }

        return {
          ...batch,
          days_to_expiry: daysToExpiry,
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon,
        } as ProductBatch
      })

      return {
        data: enrichedData,
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      throw new Error('Failed to fetch batches')
    }
  }

  static async getAdjustments(options: {
    search?: string
    status?: string
    reason?: string
    page?: number
    pageSize?: number
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<ListResponse<StockAdjustment>> {
    const { search = '', status = '', reason = '', page = 1, pageSize = 50, dateFrom, dateTo } = options

    try {
      let query = getSupabase()
        .from('inv_stock_adjustments')
        .select(`
          *,
          items:inv_stock_adjustment_items (
            *,
            product:inv_products(product_code, product_name),
            batch:inv_product_batches(batch_number, available_quantity)
          )
        `, { count: 'exact' })

      if (search.trim()) {
        query = query.or(`adjustment_number.ilike.%${search}%,notes.ilike.%${search}%`)
      }
      if (status) query = query.eq('status', status)
      if (reason) query = query.eq('reason', reason)
      if (dateFrom) query = query.gte('adjustment_date', dateFrom)
      if (dateTo) query = query.lte('adjustment_date', dateTo)

      query = query.order('created_at', { ascending: false })
      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: data as StockAdjustment[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error)
      throw new Error('Failed to fetch stock adjustments')
    }
  }

  static async createAdjustment(input: {
    adjustment_date?: string
    reason: AdjustmentReason
    notes?: string
    items: {
      product_uuid: string
      batch_uuid: string
      adjustment_type: 'INCREASE' | 'DECREASE'
      quantity: number
      notes?: string
    }[]
  }, userId?: string): Promise<StockAdjustment> {
    const errors: Record<string, string> = {}
    if (!input.reason) errors.reason = 'Reason is required'
    if (!input.items || input.items.length === 0) errors.items = 'At least one item is required'
    if (Object.keys(errors).length > 0) throw new ValidationError(errors)

    try {
      // Generate adjustment number
      const { data: adjNum, error: seqErr } = await getSupabase()
        .rpc('fn_generate_adjustment_number')
      if (seqErr) throw new Error('Failed to generate adjustment number')

      // Insert header
      const { data: adj, error: adjErr } = await getSupabase()
        .from('inv_stock_adjustments')
        .insert({
          adjustment_number: adjNum,
          adjustment_date: input.adjustment_date ?? new Date().toISOString().split('T')[0],
          reason: input.reason,
          notes: input.notes ?? null,
          status: 'draft',
          created_by: userId ?? null,
          updated_by: userId ?? null,
        })
        .select()
        .single()

      if (adjErr) throw adjErr

      const adjUuid = (adj as any).uuid

      // Insert items
      const items = input.items.map(item => ({
        adjustment_uuid: adjUuid,
        product_uuid: item.product_uuid,
        batch_uuid: item.batch_uuid,
        adjustment_type: item.adjustment_type,
        quantity: item.quantity,
        notes: item.notes ?? null,
      }))

      const { error: itemErr } = await getSupabase()
        .from('inv_stock_adjustment_items')
        .insert(items)
      if (itemErr) throw itemErr

      return this.getAdjustmentById(adjUuid)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating adjustment:', error)
      throw new Error('Failed to create stock adjustment')
    }
  }

  static async getAdjustmentById(id: string): Promise<StockAdjustment> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_stock_adjustments')
        .select(`
          *,
          items:inv_stock_adjustment_items (
            *,
            product:inv_products(product_code, product_name),
            batch:inv_product_batches(batch_number, available_quantity)
          )
        `)
        .eq('uuid', id)
        .single()

      if (error) throw error
      return data as StockAdjustment
    } catch (error) {
      console.error('Error fetching adjustment:', error)
      throw new Error('Adjustment not found')
    }
  }

  static async postAdjustment(id: string, userId?: string): Promise<StockAdjustment> {
    try {
      const existing = await this.getAdjustmentById(id)
      if (existing.status !== 'draft') {
        throw new ValidationError({ status: `Only draft adjustments can be posted. Current: '${existing.status}'` })
      }

      const { data, error } = await getSupabase()
        .rpc('fn_post_stock_adjustment', {
          p_adjustment_uuid: id,
          p_user_uuid: userId ?? null,
        })

      if (error) throw error

      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'Adjustment posting failed')

      return this.getAdjustmentById(id)
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error posting adjustment:', error)
      throw new Error('Failed to post stock adjustment')
    }
  }

  static async getStockMovements(options: {
    product_uuid?: string
    batch_uuid?: string
    movement_type?: string
    page?: number
    pageSize?: number
    dateFrom?: string
    dateTo?: string
  }): Promise<ListResponse<StockMovement>> {
    const { product_uuid, batch_uuid, movement_type, page = 1, pageSize = 50, dateFrom, dateTo } = options

    try {
      let query = getSupabase()
        .from('inv_stock_movements')
        .select(`
          *,
          product:inv_products(product_code, product_name),
          batch:inv_product_batches(batch_number)
        `, { count: 'exact' })

      if (product_uuid) query = query.eq('product_uuid', product_uuid)
      if (batch_uuid) query = query.eq('batch_uuid', batch_uuid)
      if (movement_type) query = query.eq('movement_type', movement_type)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z')

      query = query.order('created_at', { ascending: false })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query
      if (error) throw error

      return {
        data: data as StockMovement[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      throw new Error('Failed to fetch stock movements')
    }
  }

  static async getDashboardStats(): Promise<{
    totalProducts: number
    totalActiveProducts: number
    lowStockCount: number
    expiringCount: number
    outOfStockCount: number
    totalInventoryValue: number
  }> {
    try {
      const [productsRes, batchesRes, currentStockRes] = await Promise.all([
        getSupabase()
          .from('inv_products')
          .select('uuid, is_active, reorder_level')
          .eq('is_deleted', false),
        getSupabase()
          .from('inv_product_batches')
          .select('expiry_date, purchase_price, available_quantity, status')
          .eq('is_active', true)
          .eq('status', 'good'),
        getSupabase()
          .from('inv_stock_movements')
          .select('product_uuid, after_stock')
          .eq('is_active', true)
      ])

      if (productsRes.error) throw productsRes.error
      if (batchesRes.error) throw batchesRes.error
      if (currentStockRes.error) throw currentStockRes.error

      const products = productsRes.data as any[]
      const batches = batchesRes.data as any[]
      const movements = currentStockRes.data as any[]

      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 90)

      const expiringCount = batches.filter(batch => {
        if (!batch.expiry_date) return false
        const expiry = new Date(batch.expiry_date)
        return expiry >= today && expiry <= futureDate
      }).length

      // Calculate current stock per product from latest movements
      const stockByProduct = new Map<string, number>()
      movements.forEach(m => {
        stockByProduct.set(m.product_uuid, m.after_stock || 0)
      })

      const lowStockCount = products.filter(p => {
        const stock = stockByProduct.get(p.uuid) || 0
        return stock > 0 && stock <= (p.reorder_level || 10)
      }).length

      const outOfStockCount = products.filter(p => {
        const stock = stockByProduct.get(p.uuid) || 0
        return stock === 0
      }).length

      const totalInventoryValue = batches.reduce((sum, batch) => {
        return sum + (batch.purchase_price * batch.available_quantity)
      }, 0)

      return {
        totalProducts: products.length,
        totalActiveProducts: products.filter(p => p.is_active).length,
        lowStockCount,
        expiringCount,
        outOfStockCount,
        totalInventoryValue,
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalProducts: 0,
        totalActiveProducts: 0,
        lowStockCount: 0,
        expiringCount: 0,
        outOfStockCount: 0,
        totalInventoryValue: 0,
      }
    }
  }
}
