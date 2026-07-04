import { createClient } from '@supabase/supabase-js'
import { InventoryValidators, ValidationError } from './validators'

export interface Supplier {
  uuid: string
  supplier_code: string
  company_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  payment_terms?: string
  credit_days: number
  bank_name?: string
  account_number?: string
  ifsc?: string
  upi_id?: string
  opening_balance: number
  credit_limit: number
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateSupplierInput {
  company_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  payment_terms?: string
  credit_days?: number
  bank_name?: string
  account_number?: string
  ifsc?: string
  upi_id?: string
  opening_balance?: number
  credit_limit?: number
}

export interface UpdateSupplierInput {
  company_name?: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  payment_terms?: string
  credit_days?: number
  bank_name?: string
  account_number?: string
  ifsc?: string
  upi_id?: string
  opening_balance?: number
  credit_limit?: number
  is_active?: boolean
}

export interface ListOptions {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'company_name' | 'supplier_code' | 'city' | 'created_at'
  sortOrder?: 'asc' | 'desc'
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

export class SupplierService {
  private static async generateSupplierCode(): Promise<string> {
    try {
      const { data, error } = await getSupabase().rpc('fn_next_sequence_value', {
        p_key: 'seq_supplier_last_number',
      })

      if (error) throw error

      const num = String(data).padStart(6, '0')
      return `SUP-${num}`
    } catch (error) {
      console.error('Error generating supplier code:', error)
      throw new Error('Failed to generate supplier code')
    }
  }

  static async getSuppliers(
    options: ListOptions = {}
  ): Promise<ListResponse<Supplier>> {
    const {
      search = '',
      page = 1,
      pageSize = 10,
      sortBy = 'company_name',
      sortOrder = 'asc',
      includeDeleted = false,
    } = options

    try {
      let query = getSupabase()
        .from('inv_suppliers')
        .select('*', { count: 'exact' })

      if (!includeDeleted) {
        query = query.eq('is_deleted', false)
      }

      if (search.trim()) {
        query = query.or(
          `company_name.ilike.%${search}%,supplier_code.ilike.%${search}%,city.ilike.%${search}%`
        )
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Supplier[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      throw new Error('Failed to fetch suppliers')
    }
  }

  static async getSupplierById(id: string): Promise<Supplier> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_suppliers')
        .select('*')
        .eq('uuid', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Supplier not found')

      return data as Supplier
    } catch (error) {
      console.error('Error fetching supplier:', error)
      throw new Error('Failed to fetch supplier')
    }
  }

  static async createSupplier(
    input: CreateSupplierInput,
    userId?: string
  ): Promise<Supplier> {
    const validation = InventoryValidators.validateSupplier(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      const { data: existing } = await getSupabase()
        .from('inv_suppliers')
        .select('uuid')
        .eq('company_name', input.company_name)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        throw new ValidationError({
          company_name: 'Supplier name already exists',
        })
      }

      const supplierCode = await this.generateSupplierCode()

      const { data, error } = await getSupabase()
        .from('inv_suppliers')
        .insert([
          {
            supplier_code: supplierCode,
            company_name: input.company_name.trim(),
            contact_person: input.contact_person?.trim() || null,
            mobile: input.mobile?.trim() || null,
            email: input.email?.trim() || null,
            gst_number: input.gst_number?.trim() || null,
            pan: input.pan?.trim() || null,
            address: input.address?.trim() || null,
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            country: input.country?.trim() || 'India',
            pincode: input.pincode?.trim() || null,
            payment_terms: input.payment_terms?.trim() || null,
            credit_days: input.credit_days || 0,
            bank_name: input.bank_name?.trim() || null,
            account_number: input.account_number?.trim() || null,
            ifsc: input.ifsc?.trim() || null,
            upi_id: input.upi_id?.trim() || null,
            opening_balance: input.opening_balance || 0,
            credit_limit: input.credit_limit || 0,
            is_active: true,
            is_deleted: false,
            created_by: userId || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data as Supplier
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating supplier:', error)
      throw new Error('Failed to create supplier')
    }
  }

  static async updateSupplier(
    id: string,
    input: UpdateSupplierInput,
    userId?: string
  ): Promise<Supplier> {
    const existing = await this.getSupplierById(id)

    if (existing.is_deleted) {
      throw new Error('Cannot update deleted supplier')
    }

    const validation = InventoryValidators.validateSupplier(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      if (input.company_name && input.company_name !== existing.company_name) {
        const { data: duplicate } = await getSupabase()
          .from('inv_suppliers')
          .select('uuid')
          .eq('company_name', input.company_name)
          .eq('is_deleted', false)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({
            company_name: 'Supplier name already exists',
          })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }

      if (input.company_name !== undefined)
        updateData.company_name = input.company_name.trim()
      if (input.contact_person !== undefined)
        updateData.contact_person = input.contact_person?.trim() || null
      if (input.mobile !== undefined) updateData.mobile = input.mobile?.trim() || null
      if (input.email !== undefined) updateData.email = input.email?.trim() || null
      if (input.gst_number !== undefined)
        updateData.gst_number = input.gst_number?.trim() || null
      if (input.pan !== undefined) updateData.pan = input.pan?.trim() || null
      if (input.address !== undefined) updateData.address = input.address?.trim() || null
      if (input.city !== undefined) updateData.city = input.city?.trim() || null
      if (input.state !== undefined) updateData.state = input.state?.trim() || null
      if (input.country !== undefined) updateData.country = input.country?.trim() || null
      if (input.pincode !== undefined) updateData.pincode = input.pincode?.trim() || null
      if (input.payment_terms !== undefined)
        updateData.payment_terms = input.payment_terms?.trim() || null
      if (input.credit_days !== undefined) updateData.credit_days = input.credit_days
      if (input.bank_name !== undefined)
        updateData.bank_name = input.bank_name?.trim() || null
      if (input.account_number !== undefined)
        updateData.account_number = input.account_number?.trim() || null
      if (input.ifsc !== undefined) updateData.ifsc = input.ifsc?.trim() || null
      if (input.upi_id !== undefined) updateData.upi_id = input.upi_id?.trim() || null
      if (input.opening_balance !== undefined)
        updateData.opening_balance = input.opening_balance
      if (input.credit_limit !== undefined) updateData.credit_limit = input.credit_limit
      if (input.is_active !== undefined) updateData.is_active = input.is_active

      const { data, error } = await getSupabase()
        .from('inv_suppliers')
        .update(updateData)
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Supplier
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating supplier:', error)
      throw new Error('Failed to update supplier')
    }
  }

  static async deleteSupplier(id: string, userId?: string): Promise<void> {
    try {
      const { error } = await getSupabase()
        .from('inv_suppliers')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting supplier:', error)
      throw new Error('Failed to delete supplier')
    }
  }

  static async restoreSupplier(
    id: string,
    userId?: string
  ): Promise<Supplier> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_suppliers')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Supplier
    } catch (error) {
      console.error('Error restoring supplier:', error)
      throw new Error('Failed to restore supplier')
    }
  }

  static async toggleSupplierStatus(
    id: string,
    userId?: string
  ): Promise<Supplier> {
    try {
      const existing = await this.getSupplierById(id)

      const { data, error } = await getSupabase()
        .from('inv_suppliers')
        .update({
          is_active: !existing.is_active,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Supplier
    } catch (error) {
      console.error('Error toggling supplier status:', error)
      throw new Error('Failed to toggle supplier status')
    }
  }
}
