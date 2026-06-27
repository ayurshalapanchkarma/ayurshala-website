/**
 * Supplier Service
 * Handles supplier management
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { Supplier, CreateSupplierInput, UpdateSupplierInput, ValidationException } from './types'

export class SupplierService {
  /**
   * Get all suppliers
   */
  static async getSuppliers(includeDeleted = false): Promise<Supplier[]> {
    let query = supabaseAdmin.from('suppliers').select('*').order('supplier_name')

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch suppliers: ${error.message}`)
    return data || []
  }

  /**
   * Get active suppliers only
   */
  static async getActiveSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('supplier_name')

    if (error) throw new Error(`Failed to fetch suppliers: ${error.message}`)
    return data || []
  }

  /**
   * Get single supplier
   */
  static async getSupplierById(id: string): Promise<Supplier> {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Supplier not found: ${error.message}`)
    if (!data) throw new Error('Supplier not found')
    return data
  }

  /**
   * Create supplier with validation
   */
  static async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const errors: Array<{ field: string; message: string }> = []

    // Validate required fields
    if (!input.supplier_name?.trim()) {
      errors.push({ field: 'supplier_name', message: 'Supplier name is required' })
    }

    if (errors.length > 0) throw new ValidationException(errors)

    // Validate optional email
    if (input.email && !this.isValidEmail(input.email)) {
      throw new ValidationException([{ field: 'email', message: 'Invalid email format' }])
    }

    // Validate optional mobile
    if (input.mobile && !this.isValidMobile(input.mobile)) {
      throw new ValidationException([{ field: 'mobile', message: 'Invalid mobile format' }])
    }

    // Validate optional GSTIN
    if (input.gstin && !this.isValidGSTIN(input.gstin)) {
      throw new ValidationException([{ field: 'gstin', message: 'Invalid GSTIN format' }])
    }

    // Create supplier
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({
        supplier_name: input.supplier_name.trim(),
        contact_person: input.contact_person?.trim() || null,
        mobile: input.mobile?.trim() || null,
        email: input.email?.trim() || null,
        gstin: input.gstin?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create supplier: ${error.message}`)
    if (!data) throw new Error('Failed to create supplier')
    return data
  }

  /**
   * Update supplier
   */
  static async updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    // Verify supplier exists
    await this.getSupplierById(id)

    // Validate email if provided
    if (input.email && !this.isValidEmail(input.email)) {
      throw new ValidationException([{ field: 'email', message: 'Invalid email format' }])
    }

    // Validate mobile if provided
    if (input.mobile && !this.isValidMobile(input.mobile)) {
      throw new ValidationException([{ field: 'mobile', message: 'Invalid mobile format' }])
    }

    // Validate GSTIN if provided
    if (input.gstin && !this.isValidGSTIN(input.gstin)) {
      throw new ValidationException([{ field: 'gstin', message: 'Invalid GSTIN format' }])
    }

    // Build update object
    const updateData: Record<string, any> = {}

    if (input.supplier_name !== undefined) {
      if (!input.supplier_name.trim()) {
        throw new ValidationException([{ field: 'supplier_name', message: 'Supplier name cannot be empty' }])
      }
      updateData.supplier_name = input.supplier_name.trim()
    }

    if (input.contact_person !== undefined) {
      updateData.contact_person = input.contact_person?.trim() || null
    }

    if (input.mobile !== undefined) {
      updateData.mobile = input.mobile?.trim() || null
    }

    if (input.email !== undefined) {
      updateData.email = input.email?.trim() || null
    }

    if (input.gstin !== undefined) {
      updateData.gstin = input.gstin?.trim() || null
    }

    if (input.address !== undefined) {
      updateData.address = input.address?.trim() || null
    }

    if (input.city !== undefined) {
      updateData.city = input.city?.trim() || null
    }

    if (input.state !== undefined) {
      updateData.state = input.state?.trim() || null
    }

    if (input.pincode !== undefined) {
      updateData.pincode = input.pincode?.trim() || null
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null
    }

    // Update supplier
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update supplier: ${error.message}`)
    if (!data) throw new Error('Failed to update supplier')
    return data
  }

  /**
   * Soft delete supplier
   */
  static async deleteSupplier(id: string): Promise<void> {
    await this.getSupplierById(id)

    const { error } = await supabaseAdmin
      .from('suppliers')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete supplier: ${error.message}`)
  }

  /**
   * Restore deleted supplier
   */
  static async restoreSupplier(id: string): Promise<Supplier> {
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update({ is_deleted: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to restore supplier: ${error.message}`)
    if (!data) throw new Error('Failed to restore supplier')
    return data
  }

  // ============================================================
  // Validation Helpers
  // ============================================================

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidMobile(mobile: string): boolean {
    // Accept 10 digits
    const mobileRegex = /^[0-9]{10}$/
    return mobileRegex.test(mobile.replace(/[\s\-()]/g, ''))
  }

  private static isValidGSTIN(gstin: string): boolean {
    // GSTIN format: 2-digit state code + PAN (10 chars) + 1-digit division + 1-digit check digit
    const gstinRegex = /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin.toUpperCase())
  }
}
