import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface Manufacturer {
  id: string
  name: string
  gstin?: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  is_deleted: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateManufacturerInput {
  name: string
  gstin?: string
  contact_person?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  notes?: string
}

export class ManufacturerService {
  static async getManufacturers(includeDeleted = false): Promise<Manufacturer[]> {
    let query = supabaseAdmin.from('manufacturers').select('*').order('name')

    if (!includeDeleted) query = query.eq('is_deleted', false)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch manufacturers: ${error.message}`)
    return data || []
  }

  static async getManufacturerById(id: string): Promise<Manufacturer> {
    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Manufacturer not found: ${error.message}`)
    if (!data) throw new Error('Manufacturer not found')
    return data
  }

  static async createManufacturer(input: CreateManufacturerInput): Promise<Manufacturer> {
    if (!input.name?.trim()) {
      throw new ValidationException([{ field: 'name', message: 'Manufacturer name is required' }])
    }

    if (input.email && !this.isValidEmail(input.email)) {
      throw new ValidationException([{ field: 'email', message: 'Invalid email format' }])
    }

    if (input.gstin && !this.isValidGSTIN(input.gstin)) {
      throw new ValidationException([{ field: 'gstin', message: 'Invalid GSTIN format' }])
    }

    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .insert({
        name: input.name.trim(),
        gstin: input.gstin?.trim() || null,
        contact_person: input.contact_person?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        pincode: input.pincode?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create manufacturer: ${error.message}`)
    if (!data) throw new Error('Failed to create manufacturer')
    return data
  }

  static async updateManufacturer(id: string, input: Partial<CreateManufacturerInput>): Promise<Manufacturer> {
    await this.getManufacturerById(id)

    const updateData: Record<string, any> = {}

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ValidationException([{ field: 'name', message: 'Manufacturer name cannot be empty' }])
      }
      updateData.name = input.name.trim()
    }

    if (input.email !== undefined) {
      updateData.email = input.email?.trim() || null
    }

    if (input.gstin !== undefined) {
      updateData.gstin = input.gstin?.trim() || null
    }

    const { data, error } = await supabaseAdmin
      .from('manufacturers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update manufacturer: ${error.message}`)
    if (!data) throw new Error('Failed to update manufacturer')
    return data
  }

  static async deleteManufacturer(id: string): Promise<void> {
    await this.getManufacturerById(id)

    const { error } = await supabaseAdmin
      .from('manufacturers')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete manufacturer: ${error.message}`)
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  private static isValidGSTIN(gstin: string): boolean {
    return /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.toUpperCase())
  }
}
