/**
 * Product Service
 * Handles product operations with validation and relationships
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  InventoryProduct,
  CreateProductInput,
  UpdateProductInput,
  ProductSupplier,
  LinkProductSupplierInput,
  ValidationException,
} from './types'
import { CategoryService } from './category.service'

export class ProductService {
  /**
   * Get all products
   */
  static async getProducts(categoryId?: string, includeDeleted = false): Promise<InventoryProduct[]> {
    let query = supabaseAdmin.from('inventory_products').select('*').order('name')

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch products: ${error.message}`)
    return data || []
  }

  /**
   * Get single product by ID
   */
  static async getProductById(id: string): Promise<InventoryProduct> {
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Product not found: ${error.message}`)
    if (!data) throw new Error('Product not found')
    return data
  }

  /**
   * Get product by SKU
   */
  static async getProductBySku(sku: string): Promise<InventoryProduct> {
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .select('*')
      .eq('sku', sku)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Product not found: ${error.message}`)
    if (!data) throw new Error('Product not found')
    return data
  }

  /**
   * Create product with validation
   */
  static async createProduct(input: CreateProductInput): Promise<InventoryProduct> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate required fields
    if (!input.sku?.trim()) errors.push({ field: 'sku', message: 'SKU is required' })
    if (!input.name?.trim()) errors.push({ field: 'name', message: 'Product name is required' })
    if (!input.category_id?.trim()) errors.push({ field: 'category_id', message: 'Category is required' })
    if (!input.unit?.trim()) errors.push({ field: 'unit', message: 'Unit is required' })
    if (input.purchase_price < 0) errors.push({ field: 'purchase_price', message: 'Purchase price cannot be negative' })
    if (input.sale_price < 0) errors.push({ field: 'sale_price', message: 'Sale price cannot be negative' })
    if (input.mrp < 0) errors.push({ field: 'mrp', message: 'MRP cannot be negative' })
    if (input.gst_percent < 0 || input.gst_percent > 100) {
      errors.push({ field: 'gst_percent', message: 'GST must be between 0 and 100' })
    }

    if (errors.length > 0) throw new ValidationException(errors)

    // Check duplicate SKU
    const { data: existing } = await supabaseAdmin
      .from('inventory_products')
      .select('id')
      .eq('sku', input.sku.trim())
      .eq('is_deleted', false)
      .single()

    if (existing) {
      throw new ValidationException([{ field: 'sku', message: 'Product with this SKU already exists' }])
    }

    // Verify category exists
    await CategoryService.getCategoryById(input.category_id)

    // Create product
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .insert({
        sku: input.sku.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        category_id: input.category_id,
        unit: input.unit.trim(),
        purchase_price: input.purchase_price,
        sale_price: input.sale_price,
        mrp: input.mrp,
        gst_percent: input.gst_percent,
        hsn_code: input.hsn_code?.trim() || null,
        reorder_level: input.reorder_level ?? 0,
        reorder_quantity: input.reorder_quantity ?? 0,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create product: ${error.message}`)
    if (!data) throw new Error('Failed to create product')
    return data
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, input: UpdateProductInput): Promise<InventoryProduct> {
    // Verify product exists
    await this.getProductById(id)

    // Build update object
    const updateData: Record<string, any> = {}

    if (input.sku !== undefined) {
      if (!input.sku.trim()) {
        throw new ValidationException([{ field: 'sku', message: 'SKU cannot be empty' }])
      }

      const { data: existing } = await supabaseAdmin
        .from('inventory_products')
        .select('id')
        .eq('sku', input.sku.trim())
        .neq('id', id)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        throw new ValidationException([{ field: 'sku', message: 'SKU already exists' }])
      }

      updateData.sku = input.sku.trim().toUpperCase()
    }

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ValidationException([{ field: 'name', message: 'Product name cannot be empty' }])
      }
      updateData.name = input.name.trim()
    }

    if (input.category_id !== undefined) {
      await CategoryService.getCategoryById(input.category_id)
      updateData.category_id = input.category_id
    }

    if (input.purchase_price !== undefined) {
      if (input.purchase_price < 0) {
        throw new ValidationException([{ field: 'purchase_price', message: 'Price cannot be negative' }])
      }
      updateData.purchase_price = input.purchase_price
    }

    if (input.sale_price !== undefined) {
      if (input.sale_price < 0) {
        throw new ValidationException([{ field: 'sale_price', message: 'Price cannot be negative' }])
      }
      updateData.sale_price = input.sale_price
    }

    if (input.mrp !== undefined) {
      if (input.mrp < 0) {
        throw new ValidationException([{ field: 'mrp', message: 'MRP cannot be negative' }])
      }
      updateData.mrp = input.mrp
    }

    if (input.gst_percent !== undefined) {
      if (input.gst_percent < 0 || input.gst_percent > 100) {
        throw new ValidationException([{ field: 'gst_percent', message: 'GST must be between 0-100' }])
      }
      updateData.gst_percent = input.gst_percent
    }

    if (input.unit !== undefined && input.unit.trim()) {
      updateData.unit = input.unit.trim()
    }

    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null
    }

    if (input.hsn_code !== undefined) {
      updateData.hsn_code = input.hsn_code?.trim() || null
    }

    if (input.reorder_level !== undefined) {
      updateData.reorder_level = Math.max(0, input.reorder_level)
    }

    if (input.reorder_quantity !== undefined) {
      updateData.reorder_quantity = Math.max(0, input.reorder_quantity)
    }

    if (input.status !== undefined) {
      updateData.status = input.status
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null
    }

    // Update product
    const { data, error } = await supabaseAdmin
      .from('inventory_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update product: ${error.message}`)
    if (!data) throw new Error('Failed to update product')
    return data
  }

  /**
   * Soft delete product
   */
  static async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id)

    const { error } = await supabaseAdmin
      .from('inventory_products')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete product: ${error.message}`)
  }

  /**
   * Restore a deleted product
   */
  static async restoreProduct(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('inventory_products')
      .update({ is_deleted: false })
      .eq('id', id)

    if (error) throw new Error(`Failed to restore product: ${error.message}`)
  }

  /**
   * Get suppliers for a product
   */
  static async getProductSuppliers(productId: string): Promise<ProductSupplier[]> {
    await this.getProductById(productId)

    const { data, error } = await supabaseAdmin
      .from('product_suppliers')
      .select('*')
      .eq('product_id', productId)

    if (error) throw new Error(`Failed to fetch suppliers: ${error.message}`)
    return data || []
  }

  /**
   * Link supplier to product
   */
  static async linkSupplier(productId: string, input: LinkProductSupplierInput): Promise<ProductSupplier> {
    // Verify product and supplier exist
    await this.getProductById(productId)

    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', input.supplier_id)
      .eq('is_deleted', false)
      .single()

    if (!supplier) throw new Error('Supplier not found')

    // Upsert the link
    const { data, error } = await supabaseAdmin
      .from('product_suppliers')
      .upsert([
        {
          product_id: productId,
          supplier_id: input.supplier_id,
          is_preferred: input.is_preferred ?? false,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Failed to link supplier: ${error.message}`)
    if (!data) throw new Error('Failed to link supplier')
    return data
  }

  /**
   * Unlink supplier from product
   */
  static async unlinkSupplier(productId: string, supplierId: string): Promise<void> {
    await this.getProductById(productId)

    const { error } = await supabaseAdmin
      .from('product_suppliers')
      .delete()
      .eq('product_id', productId)
      .eq('supplier_id', supplierId)

    if (error) throw new Error(`Failed to unlink supplier: ${error.message}`)
  }
}
