/**
 * Report Service — Phase 4
 * Handles all inventory reports with export capabilities
 */

import { createClient } from '@supabase/supabase-js'
import { ValidationError } from './validators'

export interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  category_uuid?: string
  supplier_uuid?: string
  product_uuid?: string
  batch_uuid?: string
  warehouse_uuid?: string
  movement_type?: string
}

export interface CurrentStockReportItem {
  product_code: string
  product_name: string
  category: string
  unit: string
  current_stock: number
  reorder_level: number
  purchase_price: number
  stock_value: number
  batch_count: number
  status: string
}

export interface StockMovementReportItem {
  date: string
  product_code: string
  product_name: string
  batch_number?: string
  movement_type: string
  quantity: number
  before_stock: number
  after_stock: number
  reference: string
  remarks?: string
}

export interface InventoryValuationItem {
  product_code: string
  product_name: string
  category: string
  current_stock: number
  avg_purchase_price: number
  total_value: number
}

export interface PurchaseRegisterItem {
  po_date: string
  po_number: string
  supplier: string
  grn_number?: string
  grn_date?: string
  product_code: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  gst_amount: number
  net_amount: number
}

export interface BatchReportItem {
  batch_number: string
  product_code: string
  product_name: string
  supplier: string
  manufacturing_date?: string
  expiry_date?: string
  received_quantity: number
  available_quantity: number
  status: string
  days_to_expiry?: number
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

export class ReportService {
  static async getCurrentStockReport(filters: ReportFilters = {}): Promise<CurrentStockReportItem[]> {
    try {
      console.log('========== ReportService.getCurrentStockReport START ==========')
      console.log('Filters:', filters)
      
      let query = getSupabase()
        .from('inv_products')
        .select(`
          uuid, product_code, product_name, reorder_level,
          category:inv_categories(name),
          unit:inv_units(name)
        `)
        .eq('is_active', true)

      if (filters.category_uuid) {
        query = query.eq('category_uuid', filters.category_uuid)
      }

      console.log('Fetching active products...')
      const { data: products, error } = await query.order('product_name')
      if (error) {
        console.error('Product query error:', error)
        throw error
      }

      console.log('Products found:', products?.length)

      if (!products || products.length === 0) {
        console.log('No active products found, returning empty report')
        return []
      }

      // Fetch all batches in one query (bulk instead of per-product)
      const productUuids = (products as any[]).map(p => p.uuid)
      
      console.log('Fetching batches for', productUuids.length, 'products...')
      const { data: allBatches, error: batchErr } = await getSupabase()
        .from('inv_product_batches')
        .select('product_uuid, purchase_price, available_quantity')
        .in('product_uuid', productUuids)
        .eq('status', 'good')
        .eq('is_active', true)
        .gt('available_quantity', 0)

      if (batchErr) {
        console.error('Batch query error:', batchErr)
        throw batchErr
      }

      console.log('Batches found:', allBatches?.length)

      // Group batches by product for efficient lookup
      const batchesByProduct = new Map<string, any[]>()
      allBatches?.forEach(batch => {
        if (!batchesByProduct.has(batch.product_uuid)) {
          batchesByProduct.set(batch.product_uuid, [])
        }
        batchesByProduct.get(batch.product_uuid)!.push(batch)
      })

      // Fetch all stock movements for these products to get current stock
      console.log('Fetching stock movements...')
      const { data: movements, error: moveErr } = await getSupabase()
        .from('inv_stock_movements')
        .select('product_uuid, after_stock')
        .in('product_uuid', productUuids)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (moveErr) {
        console.error('Stock movement query error:', moveErr)
        throw moveErr
      }

      console.log('Stock movements found:', movements?.length)

      // Get latest stock per product
      const stockByProduct = new Map<string, number>()
      movements?.forEach(m => {
        if (!stockByProduct.has(m.product_uuid)) {
          stockByProduct.set(m.product_uuid, m.after_stock || 0)
        }
      })

      console.log('Products with stock data:', stockByProduct.size)

      const report = (products as any[]).map((product) => {
        const currentStock = stockByProduct.get(product.uuid) ?? 0
        const batches = batchesByProduct.get(product.uuid) ?? []
        const batchCount = batches.length

        // Calculate weighted average purchase price
        let totalValue = 0
        let totalQty = 0

        batches.forEach(batch => {
          totalValue += batch.purchase_price * batch.available_quantity
          totalQty += batch.available_quantity
        })

        const avgPurchasePrice = totalQty > 0 ? totalValue / totalQty : 0
        const stockValue = currentStock * avgPurchasePrice

        return {
          product_code: product.product_code,
          product_name: product.product_name,
          category: product.category?.name || '',
          unit: product.unit?.name || '',
          current_stock: currentStock,
          reorder_level: product.reorder_level || 0,
          purchase_price: avgPurchasePrice,
          stock_value: stockValue,
          batch_count: batchCount,
          status: currentStock <= (product.reorder_level || 0) ? 'Low Stock' : 'Normal',
        } as CurrentStockReportItem
      })

      console.log('Report generated with', report.length, 'items')
      console.log('========== ReportService.getCurrentStockReport END (SUCCESS) ==========')
      
      return report
    } catch (error) {
      console.error('========== ReportService.getCurrentStockReport ERROR ==========')
      console.error('Error:', error)
      throw error
    }
  }

  static async getStockMovementReport(filters: ReportFilters = {}): Promise<StockMovementReportItem[]> {
    try {
      let query = getSupabase()
        .from('inv_stock_movements')
        .select(`
          created_at, movement_type, quantity, before_stock, after_stock, 
          reference_type, reference_uuid, remarks,
          product:inv_products(product_code, product_name),
          batch:inv_product_batches(batch_number)
        `)

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59Z')
      }
      if (filters.product_uuid) {
        query = query.eq('product_uuid', filters.product_uuid)
      }
      if (filters.movement_type) {
        query = query.eq('movement_type', filters.movement_type)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error

      return (data as any[]).map(movement => ({
        date: new Date(movement.created_at).toLocaleDateString(),
        product_code: movement.product?.product_code || '',
        product_name: movement.product?.product_name || '',
        batch_number: movement.batch?.batch_number,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        before_stock: movement.before_stock,
        after_stock: movement.after_stock,
        reference: `${movement.reference_type || ''} ${movement.reference_uuid || ''}`.trim(),
        remarks: movement.remarks,
      } as StockMovementReportItem))
    } catch (error) {
      console.error('Error generating stock movement report:', error)
      throw new Error('Failed to generate stock movement report')
    }
  }

  static async getInventoryValuation(filters: ReportFilters = {}): Promise<InventoryValuationItem[]> {
    try {
      const stockReport = await this.getCurrentStockReport(filters)

      return stockReport
        .filter(item => item.current_stock > 0)
        .map(item => ({
          product_code: item.product_code,
          product_name: item.product_name,
          category: item.category,
          current_stock: item.current_stock,
          avg_purchase_price: item.purchase_price,
          total_value: item.stock_value,
        } as InventoryValuationItem))
        .sort((a, b) => b.total_value - a.total_value)
    } catch (error) {
      console.error('Error generating inventory valuation:', error)
      throw new Error('Failed to generate inventory valuation')
    }
  }

  static async getPurchaseRegister(filters: ReportFilters = {}): Promise<PurchaseRegisterItem[]> {
    try {
      let query = getSupabase()
        .from('inv_purchase_order_items')
        .select(`
          quantity, unit_price, discount_percent, gst_percent, total_amount,
          purchase_order:inv_purchase_orders(po_number, po_date, 
            supplier:inv_suppliers(company_name)
          ),
          product:inv_products(product_code, product_name),
          grn_items:inv_grn_items(
            grn:inv_grns(grn_number, grn_date)
          )
        `)

      if (filters.dateFrom || filters.dateTo) {
        const poQuery = getSupabase()
          .from('inv_purchase_orders')
          .select('uuid')

        if (filters.dateFrom) poQuery.gte('po_date', filters.dateFrom)
        if (filters.dateTo) poQuery.lte('po_date', filters.dateTo)

        const { data: pos } = await poQuery
        if (pos && pos.length > 0) {
          const poUuids = pos.map(po => (po as any).uuid)
          query = query.in('purchase_order_uuid', poUuids)
        } else {
          return [] // No POs in date range
        }
      }

      if (filters.supplier_uuid) {
        const poQuery = getSupabase()
          .from('inv_purchase_orders')
          .select('uuid')
          .eq('supplier_uuid', filters.supplier_uuid)

        const { data: pos } = await poQuery
        if (pos && pos.length > 0) {
          const poUuids = pos.map(po => (po as any).uuid)
          query = query.in('purchase_order_uuid', poUuids)
        } else {
          return []
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error

      return (data as any[]).map(item => {
        const gstAmount = (item.total_amount * (item.gst_percent || 0)) / 100
        const netAmount = item.total_amount + gstAmount

        return {
          po_date: item.purchase_order?.po_date || '',
          po_number: item.purchase_order?.po_number || '',
          supplier: item.purchase_order?.supplier?.company_name || '',
          grn_number: item.grn_items?.[0]?.grn?.grn_number,
          grn_date: item.grn_items?.[0]?.grn?.grn_date,
          product_code: item.product?.product_code || '',
          product_name: item.product?.product_name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.total_amount,
          gst_amount: gstAmount,
          net_amount: netAmount,
        } as PurchaseRegisterItem
      })
    } catch (error) {
      console.error('Error generating purchase register:', error)
      throw new Error('Failed to generate purchase register')
    }
  }

  static async getBatchReport(filters: ReportFilters = {}): Promise<BatchReportItem[]> {
    try {
      let query = getSupabase()
        .from('inv_product_batches')
        .select(`
          batch_number, manufacturing_date, expiry_date, 
          received_quantity, available_quantity, status,
          product:inv_products(product_code, product_name),
          supplier:inv_suppliers(company_name)
        `)
        .eq('is_active', true)

      if (filters.product_uuid) {
        query = query.eq('product_uuid', filters.product_uuid)
      }
      if (filters.supplier_uuid) {
        query = query.eq('supplier_uuid', filters.supplier_uuid)
      }

      const { data, error } = await query.order('expiry_date', { ascending: true })
      if (error) throw error

      const today = new Date()

      return (data as any[]).map(batch => {
        let daysToExpiry: number | undefined

        if (batch.expiry_date) {
          const expiry = new Date(batch.expiry_date)
          daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
          batch_number: batch.batch_number,
          product_code: batch.product?.product_code || '',
          product_name: batch.product?.product_name || '',
          supplier: batch.supplier?.company_name || '',
          manufacturing_date: batch.manufacturing_date,
          expiry_date: batch.expiry_date,
          received_quantity: batch.received_quantity,
          available_quantity: batch.available_quantity,
          status: batch.status,
          days_to_expiry: daysToExpiry,
        } as BatchReportItem
      })
    } catch (error) {
      console.error('Error generating batch report:', error)
      throw new Error('Failed to generate batch report')
    }
  }

  static async getLowStockReport(filters: ReportFilters = {}): Promise<CurrentStockReportItem[]> {
    const stockReport = await this.getCurrentStockReport(filters)
    return stockReport.filter(item => item.status === 'Low Stock')
  }

  static async getExpiryReport(filters: ReportFilters = {}): Promise<BatchReportItem[]> {
    const batchReport = await this.getBatchReport(filters)
    return batchReport.filter(item => 
      item.expiry_date && 
      item.days_to_expiry !== undefined && 
      item.days_to_expiry <= 90 &&
      item.available_quantity > 0
    ).sort((a, b) => (a.days_to_expiry || 0) - (b.days_to_expiry || 0))
  }

  static async getDeadStockReport(filters: ReportFilters = {}): Promise<CurrentStockReportItem[]> {
    const stockReport = await this.getCurrentStockReport(filters)
    
    // Dead stock = no movement in last 180 days and stock > 0
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)
    
    const deadStockItems: CurrentStockReportItem[] = []
    
    for (const item of stockReport) {
      if (item.current_stock > 0) {
        // Check for recent movements
        const { data: movements } = await getSupabase()
          .from('inv_stock_movements')
          .select('uuid', { count: 'exact', head: true })
          .eq('product_uuid', item.product_code) // This should be UUID, adjust if needed
          .gte('created_at', sixMonthsAgo.toISOString())
        
        if ((movements as any) === 0) {
          deadStockItems.push({
            ...item,
            status: 'Dead Stock'
          })
        }
      }
    }
    
    return deadStockItems
  }

  static async getProductLedger(productUuid: string, filters: ReportFilters = {}): Promise<StockMovementReportItem[]> {
    return this.getStockMovementReport({
      ...filters,
      product_uuid: productUuid
    })
  }
}
