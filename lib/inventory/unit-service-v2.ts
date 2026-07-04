import { createClient } from '@supabase/supabase-js'
import { InventoryValidators, ValidationError } from './validators'

export interface Unit {
  uuid: string
  name: string
  short_name: string
  decimal_allowed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateUnitInput {
  name: string
  short_name: string
  decimal_allowed?: boolean
}

export interface UpdateUnitInput {
  name?: string
  short_name?: string
  decimal_allowed?: boolean
  is_active?: boolean
}

export interface ListOptions {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'short_name' | 'created_at'
  sortOrder?: 'asc' | 'desc'
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

export class UnitService {
  static async getUnits(options: ListOptions = {}): Promise<ListResponse<Unit>> {
    const {
      search = '',
      page = 1,
      pageSize = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options

    try {
      let query = getSupabase()
        .from('inv_units')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,short_name.ilike.%${search}%`)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Unit[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching units:', error)
      throw new Error('Failed to fetch units')
    }
  }

  static async getUnitById(id: string): Promise<Unit> {
    try {
      const { data, error } = await getSupabase()
        .from('inv_units')
        .select('*')
        .eq('uuid', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Unit not found')

      return data as Unit
    } catch (error) {
      console.error('Error fetching unit:', error)
      throw new Error('Failed to fetch unit')
    }
  }

  static async createUnit(input: CreateUnitInput, userId?: string): Promise<Unit> {
    const validation = InventoryValidators.validateUnit(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      const { data: existing } = await getSupabase()
        .from('inv_units')
        .select('uuid')
        .eq('name', input.name)
        .single()

      if (existing) {
        throw new ValidationError({ name: 'Unit name already exists' })
      }

      const { data: existingShort } = await getSupabase()
        .from('inv_units')
        .select('uuid')
        .eq('short_name', input.short_name)
        .single()

      if (existingShort) {
        throw new ValidationError({ short_name: 'Short name already exists' })
      }

      const { data, error } = await getSupabase()
        .from('inv_units')
        .insert([
          {
            name: input.name.trim(),
            short_name: input.short_name.trim(),
            decimal_allowed: input.decimal_allowed || false,
            is_active: true,
            created_by: userId || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data as Unit
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating unit:', error)
      throw new Error('Failed to create unit')
    }
  }

  static async updateUnit(
    id: string,
    input: UpdateUnitInput,
    userId?: string
  ): Promise<Unit> {
    const existing = await this.getUnitById(id)

    const validation = InventoryValidators.validateUnit(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      if (input.name && input.name !== existing.name) {
        const { data: duplicate } = await getSupabase()
          .from('inv_units')
          .select('uuid')
          .eq('name', input.name)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({ name: 'Unit name already exists' })
        }
      }

      if (input.short_name && input.short_name !== existing.short_name) {
        const { data: duplicate } = await getSupabase()
          .from('inv_units')
          .select('uuid')
          .eq('short_name', input.short_name)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({ short_name: 'Short name already exists' })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }

      if (input.name !== undefined) updateData.name = input.name.trim()
      if (input.short_name !== undefined) updateData.short_name = input.short_name.trim()
      if (input.decimal_allowed !== undefined) updateData.decimal_allowed = input.decimal_allowed
      if (input.is_active !== undefined) updateData.is_active = input.is_active

      const { data, error } = await getSupabase()
        .from('inv_units')
        .update(updateData)
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Unit
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating unit:', error)
      throw new Error('Failed to update unit')
    }
  }

  static async toggleUnitStatus(id: string, userId?: string): Promise<Unit> {
    try {
      const existing = await this.getUnitById(id)

      const { data, error } = await getSupabase()
        .from('inv_units')
        .update({
          is_active: !existing.is_active,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Unit
    } catch (error) {
      console.error('Error toggling unit status:', error)
      throw new Error('Failed to toggle unit status')
    }
  }
}
