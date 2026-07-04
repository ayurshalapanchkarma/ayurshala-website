import { createClient } from '@supabase/supabase-js'
import { InventoryValidators, ValidationError } from './validators'

export interface Product {
  uuid: string
  product_code: string
  sku?: string
  barcode?: string
  product_name: string
  generic_name?: string
  category_uuid: string
  manufacturer_uuid?: string
  unit_uuid: string
  default_supplier_uuid?: string
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
  hsn_code?: string
  minimum_stock: number
  reorder_level: number
  maximum_stock?: number
  batch_tracking: boolean
  expiry_tracking: boolean
  is_prescription: boolean
  storage_location?: string
  rack_number?: string
  shelf_number?: string
  bin_number?: string
  description?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateProductInput {
  product_code?: string
  sku?: string
  barcode?: string
  product_name: string
  generic_name?: string
  category_uuid: string
  manufacturer_uuid?: string
  unit_uuid: string
  default_supplier_uuid?: string
  purchase_price: number
  selling_price: number
  mrp: number
  gst_percentage: number
  hsn_code?: string
  minimum_stock: number
  reorder_level: number
  maximum_stock?: number
  batch_tracking?: boolean
  expiry_tracking?: boolean
  is_prescription?: boolean
  storage_location?: string
  rack_number?: string
  shelf_number?: string
  bin_number?: string
  description?: string
}

export interface UpdateProductInput {
  sku?: string
  barcode?: string
  product_name?: string
  generic_name?: string
  category_uuid?: string
  manufacturer_uuid?: string
  unit_uuid?: string
  default_supplier_uuid?: string
  purchase_price?: number
  selling_price?: number
  mrp?: number
  gst_percentage?: number
  hsn_code?: string
  minimum_stock?: number
  reorder_level?: number
  maximum_stock?: number
  batch_tracking?: boolean
  expiry_tracking?: boolean
  is_prescription?: boolean
  storage_location?: string
  rack_number?: string
  shelf_number?: string
  bin_number?: string
  description?: string
  is_active?: boolean
}

export interface ListOptions {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'product_name' | 'product_code' | 'category_uuid' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  categoryId?: string
  manufacturerId?: string
  includeDeleted?: boolean
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Lazy initialize Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase configuration missing')
    }
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

export class ProductService {
  private static async generateProductCode(): Promise<string> {
    try {
      const { data, error } = await getSupabase().rpc('fn_next_sequence_value', {
        p_key: 'seq_product_last_number',
      })

      if (error) throw error

      const num = String(data).padStart(4, '0')
      return `PRD-${num}`
    } catch (error) {
      console.error('Error generating product code:', error)
      throw new Error('Failed to generate product code')
    }
  }

  static async getProducts(options: ListOptions = {}): Promise<ListResponse<Product>> {
    const {
      search = '',
      page = 1,
      pageSize = 10,
      sortBy = 'product_name',
      sortOrder = 'asc',
      categoryId,
      manufacturerId,
      includeDeleted = false,
    } = options

    try {
      let query = getSupabase()
        .from('inv_products')
        .select('*', { count: 'exact' })

      if (!includeDeleted) {
        query = query.eq('is_deleted', false)
      }

      if (search.trim()) {
        query = query.or(
          `product_name.ilike.%${search}%,product_code.ilike.%${search}%,sku.ilike.%${search}%`
        )
      }

      if (categoryId) {
        query = query.eq('category_uuid', categoryId)
      }

      if (manufacturerId) {
        query = query.eq('manufacturer_uuid', manufacturerId)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Product[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }
  }

  static async getProductById(id: string): Promise<Product> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_products')
        .select('*')
        .eq('uuid', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Product not found')

      return data as Product
    } catch (error) {
      console.error('Error fetching product:', error)
      throw new Error('Failed to fetch product')
    }
  }

  static async createProduct(
    input: CreateProductInput,
    userId?: string
  ): Promise<Product> {
    const validation = InventoryValidators.validateProduct(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      const { data: existing } = await getSupabase()
        .from('inv_products')
        .select('uuid')
        .eq('product_name', input.product_name)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        throw new ValidationError({
          product_name: 'Product name already exists',
        })
      }

      let productCode = input.product_code
      if (!productCode) {
        productCode = await this.generateProductCode()
      } else {
        const { data: codeExists } = await getSupabase()
          .from('inv_products')
          .select('uuid')
          .eq('product_code', productCode)
          .eq('is_deleted', false)
          .single()

        if (codeExists) {
          throw new ValidationError({
            product_code: 'Product code already exists',
          })
        }
      }

      const { data, error } = await getSupabase()
        .from('inv_products')
        .insert([
          {
            product_code: productCode,
            sku: input.sku?.trim() || null,
            barcode: input.barcode?.trim() || null,
            product_name: input.product_name.trim(),
            generic_name: input.generic_name?.trim() || null,
            category_uuid: input.category_uuid,
            manufacturer_uuid: input.manufacturer_uuid || null,
            unit_uuid: input.unit_uuid,
            default_supplier_uuid: input.default_supplier_uuid || null,
            purchase_price: input.purchase_price,
            selling_price: input.selling_price,
            mrp: input.mrp,
            gst_percentage: input.gst_percentage,
            hsn_code: input.hsn_code?.trim() || null,
            minimum_stock: input.minimum_stock,
            reorder_level: input.reorder_level,
            maximum_stock: input.maximum_stock || null,
            batch_tracking: input.batch_tracking !== false,
            expiry_tracking: input.expiry_tracking !== false,
            is_prescription: input.is_prescription || false,
            storage_location: input.storage_location?.trim() || null,
            rack_number: input.rack_number?.trim() || null,
            shelf_number: input.shelf_number?.trim() || null,
            bin_number: input.bin_number?.trim() || null,
            description: input.description?.trim() || null,
            is_active: true,
            is_deleted: false,
            created_by: userId || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data as Product
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating product:', error)
      throw new Error('Failed to create product')
    }
  }

  static async updateProduct(
    id: string,
    input: UpdateProductInput,
    userId?: string
  ): Promise<Product> {
    const existing = await this.getProductById(id)

    if (existing.is_deleted) {
      throw new Error('Cannot update deleted product')
    }

    const validation = InventoryValidators.validateProduct(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      if (input.product_name && input.product_name !== existing.product_name) {
        const { data: duplicate } = await getSupabase()
          .from('inv_products')
          .select('uuid')
          .eq('product_name', input.product_name)
          .eq('is_deleted', false)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({
            product_name: 'Product name already exists',
          })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }

      if (input.sku !== undefined) updateData.sku = input.sku?.trim() || null
      if (input.barcode !== undefined) updateData.barcode = input.barcode?.trim() || null
      if (input.product_name !== undefined)
        updateData.product_name = input.product_name.trim()
      if (input.generic_name !== undefined)
        updateData.generic_name = input.generic_name?.trim() || null
      if (input.category_uuid !== undefined)
        updateData.category_uuid = input.category_uuid
      if (input.manufacturer_uuid !== undefined)
        updateData.manufacturer_uuid = input.manufacturer_uuid || null
      if (input.unit_uuid !== undefined) updateData.unit_uuid = input.unit_uuid
      if (input.default_supplier_uuid !== undefined)
        updateData.default_supplier_uuid = input.default_supplier_uuid || null
      if (input.purchase_price !== undefined)
        updateData.purchase_price = input.purchase_price
      if (input.selling_price !== undefined)
        updateData.selling_price = input.selling_price
      if (input.mrp !== undefined) updateData.mrp = input.mrp
      if (input.gst_percentage !== undefined)
        updateData.gst_percentage = input.gst_percentage
      if (input.hsn_code !== undefined) updateData.hsn_code = input.hsn_code?.trim() || null
      if (input.minimum_stock !== undefined)
        updateData.minimum_stock = input.minimum_stock
      if (input.reorder_level !== undefined)
        updateData.reorder_level = input.reorder_level
      if (input.maximum_stock !== undefined)
        updateData.maximum_stock = input.maximum_stock || null
      if (input.batch_tracking !== undefined)
        updateData.batch_tracking = input.batch_tracking
      if (input.expiry_tracking !== undefined)
        updateData.expiry_tracking = input.expiry_tracking
      if (input.is_prescription !== undefined)
        updateData.is_prescription = input.is_prescription
      if (input.storage_location !== undefined)
        updateData.storage_location = input.storage_location?.trim() || null
      if (input.rack_number !== undefined)
        updateData.rack_number = input.rack_number?.trim() || null
      if (input.shelf_number !== undefined)
        updateData.shelf_number = input.shelf_number?.trim() || null
      if (input.bin_number !== undefined)
        updateData.bin_number = input.bin_number?.trim() || null
      if (input.description !== undefined)
        updateData.description = input.description?.trim() || null
      if (input.is_active !== undefined) updateData.is_active = input.is_active

      const { data, error } = await getSupabase()
        .from('inv_products')
        .update(updateData)
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Product
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating product:', error)
      throw new Error('Failed to update product')
    }
  }

  static async deleteProduct(id: string, userId?: string): Promise<void> {
    try {
      const { error } = await getSupabase()
        .from('inv_products')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting product:', error)
      throw new Error('Failed to delete product')
    }
  }

  static async restoreProduct(id: string, userId?: string): Promise<Product> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_products')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Product
    } catch (error) {
      console.error('Error restoring product:', error)
      throw new Error('Failed to restore product')
    }
  }

  static async toggleProductStatus(id: string, userId?: string): Promise<Product> {
    try {
      const existing = await this.getProductById(id)

      const { data, error } = await getSupabase()
        .from('inv_products')
        .update({
          is_active: !existing.is_active,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Product
    } catch (error) {
      console.error('Error toggling product status:', error)
      throw new Error('Failed to toggle product status')
    }
  }
}
