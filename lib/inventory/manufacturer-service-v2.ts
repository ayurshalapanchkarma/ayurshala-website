import { createClient } from '@supabase/supabase-js'
import { InventoryValidators, ValidationError } from './validators'

export interface Manufacturer {
  uuid: string
  manufacturer_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  city?: string
  state?: string
  website?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateManufacturerInput {
  manufacturer_name: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  city?: string
  state?: string
  website?: string
}

export interface UpdateManufacturerInput {
  manufacturer_name?: string
  contact_person?: string
  mobile?: string
  email?: string
  gst_number?: string
  city?: string
  state?: string
  website?: string
  is_active?: boolean
}

export interface ListOptions {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'manufacturer_name' | 'city' | 'created_at'
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

export class ManufacturerService {
  static async getManufacturers(
    options: ListOptions = {}
  ): Promise<ListResponse<Manufacturer>> {
    const {
      search = '',
      page = 1,
      pageSize = 10,
      sortBy = 'manufacturer_name',
      sortOrder = 'asc',
      includeDeleted = false,
    } = options

    try {
      let query = getSupabase()
        .from('inv_manufacturers')
        .select('*', { count: 'exact' })

      if (!includeDeleted) {
        query = query.eq('is_deleted', false)
      }

      if (search.trim()) {
        query = query.or(
          `manufacturer_name.ilike.%${search}%,city.ilike.%${search}%`
        )
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Manufacturer[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching manufacturers:', error)
      throw new Error('Failed to fetch manufacturers')
    }
  }

  static async getManufacturerById(id: string): Promise<Manufacturer> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_manufacturers')
        .select('*')
        .eq('uuid', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Manufacturer not found')

      return data as Manufacturer
    } catch (error) {
      console.error('Error fetching manufacturer:', error)
      throw new Error('Failed to fetch manufacturer')
    }
  }

  static async createManufacturer(
    input: CreateManufacturerInput,
    userId?: string
  ): Promise<Manufacturer> {
    const validation = InventoryValidators.validateManufacturer(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      const { data: existing } = await getSupabase()
        .from('inv_manufacturers')
        .select('uuid')
        .eq('manufacturer_name', input.manufacturer_name)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        throw new ValidationError({
          manufacturer_name: 'Manufacturer name already exists',
        })
      }

      const { data, error } = await getSupabase()
        .from('inv_manufacturers')
        .insert([
          {
            manufacturer_name: input.manufacturer_name.trim(),
            contact_person: input.contact_person?.trim() || null,
            mobile: input.mobile?.trim() || null,
            email: input.email?.trim() || null,
            gst_number: input.gst_number?.trim() || null,
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            website: input.website?.trim() || null,
            is_active: true,
            is_deleted: false,
            created_by: userId || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data as Manufacturer
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating manufacturer:', error)
      throw new Error('Failed to create manufacturer')
    }
  }

  static async updateManufacturer(
    id: string,
    input: UpdateManufacturerInput,
    userId?: string
  ): Promise<Manufacturer> {
    const existing = await this.getManufacturerById(id)

    if (existing.is_deleted) {
      throw new Error('Cannot update deleted manufacturer')
    }

    const validation = InventoryValidators.validateManufacturer(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      if (input.manufacturer_name && input.manufacturer_name !== existing.manufacturer_name) {
        const { data: duplicate } = await getSupabase()
          .from('inv_manufacturers')
          .select('uuid')
          .eq('manufacturer_name', input.manufacturer_name)
          .eq('is_deleted', false)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({
            manufacturer_name: 'Manufacturer name already exists',
          })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }

      if (input.manufacturer_name !== undefined)
        updateData.manufacturer_name = input.manufacturer_name.trim()
      if (input.contact_person !== undefined)
        updateData.contact_person = input.contact_person?.trim() || null
      if (input.mobile !== undefined) updateData.mobile = input.mobile?.trim() || null
      if (input.email !== undefined) updateData.email = input.email?.trim() || null
      if (input.gst_number !== undefined)
        updateData.gst_number = input.gst_number?.trim() || null
      if (input.city !== undefined) updateData.city = input.city?.trim() || null
      if (input.state !== undefined) updateData.state = input.state?.trim() || null
      if (input.website !== undefined) updateData.website = input.website?.trim() || null
      if (input.is_active !== undefined) updateData.is_active = input.is_active

      const { data, error } = await getSupabase()
        .from('inv_manufacturers')
        .update(updateData)
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Manufacturer
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating manufacturer:', error)
      throw new Error('Failed to update manufacturer')
    }
  }

  static async deleteManufacturer(id: string, userId?: string): Promise<void> {
    try {
      const { error } = await getSupabase()
        .from('inv_manufacturers')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting manufacturer:', error)
      throw new Error('Failed to delete manufacturer')
    }
  }

  static async restoreManufacturer(
    id: string,
    userId?: string
  ): Promise<Manufacturer> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_manufacturers')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Manufacturer
    } catch (error) {
      console.error('Error restoring manufacturer:', error)
      throw new Error('Failed to restore manufacturer')
    }
  }

  static async toggleManufacturerStatus(
    id: string,
    userId?: string
  ): Promise<Manufacturer> {
    try {
      const existing = await this.getManufacturerById(id)

      const { data, error } = await getSupabase()
        .from('inv_manufacturers')
        .update({
          is_active: !existing.is_active,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Manufacturer
    } catch (error) {
      console.error('Error toggling manufacturer status:', error)
      throw new Error('Failed to toggle manufacturer status')
    }
  }
}
