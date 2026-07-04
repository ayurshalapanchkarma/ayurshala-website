/**
 * Pharmacy Medicine Service — Phase 5
 * Handles medicine search, availability, and batch selection for POS
 */

import { createClient } from '@supabase/supabase-js'

export interface MedicineDetail {
  uuid: string
  product_code: string
  product_name: string
  generic_name?: string
  category_name?: string
  manufacturer_name?: string
  unit_name?: string
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
  hsn_code?: string
  current_stock: number
  reorder_level: number
  batches: BatchDetail[]
}

export interface BatchDetail {
  uuid: string
  batch_number: string
  manufacturing_date?: string
  expiry_date?: string
  available_quantity: number
  purchase_price: number
  selling_price: number
  mrp: number
  status: string
  is_expired: boolean
  days_to_expiry?: number
}

export interface SearchOptions {
  search?: string
  searchType?: 'name' | 'generic' | 'barcode' | 'batch'
  includeOutOfStock?: boolean
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export class PharmacyMedicineService {
  /**
   * Search medicines for POS
   */
  static async searchMedicines(options: SearchOptions = {}): Promise<MedicineDetail[]> {
    const {
      search = '',
      searchType = 'name',
      includeOutOfStock = false,
    } = options

    try {
      let query = getSupabase()
        .from('inv_products')
        .select(`
          uuid, product_code, product_name, generic_name, 
          purchase_price, selling_price, mrp, gst_percentage, hsn_code,
          reorder_level,
          category:inv_categories(name),
          unit:inv_units(name),
          manufacturer:inv_manufacturers(manufacturer_name)
        `)
        .eq('is_active', true)
        .eq('is_deleted', false)

      // Apply search filter
      if (search.trim()) {
        if (searchType === 'name') {
          query = query.ilike('product_name', `%${search}%`)
        } else if (searchType === 'generic') {
          query = query.ilike('generic_name', `%${search}%`)
        } else if (searchType === 'barcode') {
          query = query.ilike('sku', `%${search}%`)
        } else if (searchType === 'batch') {
          // For batch search, we'll filter in memory after getting products
        }
      }

      const { data: products, error } = await query

      if (error) throw error

      // Get stock and batches for each product
      const medicines: MedicineDetail[] = []

      for (const product of products || []) {
        // Get current stock
        const { data: stockData } = await getSupabase()
          .rpc('fn_get_product_stock', { p_product_uuid: product.uuid })

        const currentStock = stockData || 0

        if (!includeOutOfStock && currentStock === 0) {
          continue
        }

        // Get batches
        const { data: batches, error: batchError } = await getSupabase()
          .from('inv_product_batches')
          .select('*')
          .eq('product_uuid', product.uuid)
          .eq('status', 'good')
          .eq('is_active', true)
          .gt('available_quantity', 0)
          .order('created_at', { ascending: true })

        if (batchError) throw batchError

        const today = new Date()

        const batchDetails: BatchDetail[] = (batches || [])
          .filter((b: any) => {
            // Filter by batch number if searching by batch
            if (searchType === 'batch' && search.trim()) {
              return b.batch_number.includes(search)
            }
            return true
          })
          .map((b: any) => {
            let daysToExpiry = undefined
            let isExpired = false

            if (b.expiry_date) {
              const expiryDate = new Date(b.expiry_date)
              isExpired = expiryDate < today
              daysToExpiry = Math.floor(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )
            }

            return {
              uuid: b.uuid,
              batch_number: b.batch_number,
              manufacturing_date: b.manufacturing_date,
              expiry_date: b.expiry_date,
              available_quantity: b.available_quantity,
              purchase_price: b.purchase_price,
              selling_price: b.selling_price,
              mrp: b.mrp,
              status: b.status,
              is_expired: isExpired,
              days_to_expiry: daysToExpiry,
            }
          })

        medicines.push({
          uuid: product.uuid,
          product_code: product.product_code,
          product_name: product.product_name,
          generic_name: product.generic_name,
          category_name: product.category?.name,
          manufacturer_name: product.manufacturer?.manufacturer_name,
          unit_name: product.unit?.name,
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          mrp: product.mrp,
          gst_percentage: product.gst_percentage,
          hsn_code: product.hsn_code,
          current_stock: currentStock,
          reorder_level: product.reorder_level,
          batches: batchDetails,
        })
      }

      return medicines
    } catch (error) {
      console.error('Error searching medicines:', error)
      throw new Error('Failed to search medicines')
    }
  }

  /**
   * Get single medicine detail
   */
  static async getMedicineById(productId: string): Promise<MedicineDetail> {
    try {
      const { data: product, error } = await getSupabase()
        .from('inv_products')
        .select(`
          uuid, product_code, product_name, generic_name, 
          purchase_price, selling_price, mrp, gst_percentage, hsn_code,
          reorder_level,
          category:inv_categories(name),
          unit:inv_units(name),
          manufacturer:inv_manufacturers(manufacturer_name)
        `)
        .eq('uuid', productId)
        .single()

      if (error) throw error

      // Get stock
      const { data: stockData } = await getSupabase()
        .rpc('fn_get_product_stock', { p_product_uuid: productId })

      // Get batches
      const { data: batches, error: batchError } = await getSupabase()
        .from('inv_product_batches')
        .select('*')
        .eq('product_uuid', productId)
        .eq('status', 'good')
        .eq('is_active', true)
        .gt('available_quantity', 0)
        .order('created_at', { ascending: true })

      if (batchError) throw batchError

      const today = new Date()

      const batchDetails: BatchDetail[] = (batches || []).map((b: any) => {
        let daysToExpiry = undefined
        let isExpired = false

        if (b.expiry_date) {
          const expiryDate = new Date(b.expiry_date)
          isExpired = expiryDate < today
          daysToExpiry = Math.floor(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        return {
          uuid: b.uuid,
          batch_number: b.batch_number,
          manufacturing_date: b.manufacturing_date,
          expiry_date: b.expiry_date,
          available_quantity: b.available_quantity,
          purchase_price: b.purchase_price,
          selling_price: b.selling_price,
          mrp: b.mrp,
          status: b.status,
          is_expired: isExpired,
          days_to_expiry: daysToExpiry,
        }
      })

      return {
        uuid: product.uuid,
        product_code: product.product_code,
        product_name: product.product_name,
        generic_name: product.generic_name,
        category_name: product.category?.name,
        manufacturer_name: product.manufacturer?.manufacturer_name,
        unit_name: product.unit?.name,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        mrp: product.mrp,
        gst_percentage: product.gst_percentage,
        hsn_code: product.hsn_code,
        current_stock: stockData || 0,
        reorder_level: product.reorder_level,
        batches: batchDetails,
      }
    } catch (error) {
      console.error('Error fetching medicine:', error)
      throw new Error('Failed to fetch medicine details')
    }
  }

  /**
   * Get medicine by barcode
   */
  static async getMedicineByBarcode(barcode: string): Promise<MedicineDetail | null> {
    try {
      const { data: product, error } = await getSupabase()
        .from('inv_products')
        .select(`
          uuid, product_code, product_name, generic_name, 
          purchase_price, selling_price, mrp, gst_percentage, hsn_code,
          reorder_level,
          category:inv_categories(name),
          unit:inv_units(name),
          manufacturer:inv_manufacturers(manufacturer_name)
        `)
        .eq('sku', barcode)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single()

      if (error) {
        return null
      }

      return this.getMedicineById(product.uuid)
    } catch (error) {
      console.error('Error fetching medicine by barcode:', error)
      return null
    }
  }

  /**
   * Get available batches for a product (for FIFO selection in POS)
   */
  static async getAvailableBatches(productId: string): Promise<BatchDetail[]> {
    try {
      const today = new Date()

      const { data: batches, error } = await getSupabase()
        .from('inv_product_batches')
        .select('*')
        .eq('product_uuid', productId)
        .eq('status', 'good')
        .eq('is_active', true)
        .gt('available_quantity', 0)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (batches || []).map((b: any) => {
        let daysToExpiry = undefined
        let isExpired = false

        if (b.expiry_date) {
          const expiryDate = new Date(b.expiry_date)
          isExpired = expiryDate < today
          if (!isExpired) {
            daysToExpiry = Math.floor(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
          }
        }

        return {
          uuid: b.uuid,
          batch_number: b.batch_number,
          manufacturing_date: b.manufacturing_date,
          expiry_date: b.expiry_date,
          available_quantity: b.available_quantity,
          purchase_price: b.purchase_price,
          selling_price: b.selling_price,
          mrp: b.mrp,
          status: b.status,
          is_expired: isExpired,
          days_to_expiry: daysToExpiry,
        }
      })
    } catch (error) {
      console.error('Error fetching available batches:', error)
      throw new Error('Failed to fetch batches')
    }
  }
}
