import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface CreateTherapistInput {
  name: string
  specialization?: string
  licenseNumber?: string
  phoneNumber?: string
  email?: string
}

export class TherapistService {
  /**
   * Create therapist
   */
  static async createTherapist(input: CreateTherapistInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.name?.trim()) errors.push({ field: 'name', message: 'Name required' })
    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .insert({
        name: input.name.trim(),
        specialization: input.specialization || null,
        license_number: input.licenseNumber || null,
        phone_number: input.phoneNumber || null,
        email: input.email || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create therapist: ${error.message}`)
    return data
  }

  /**
   * Get all active therapists
   */
  static async getActiveTherapists(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('name', { ascending: true })

    return data || []
  }

  /**
   * Get therapist by ID
   */
  static async getTherapist(therapistId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('therapists')
      .select('*')
      .eq('id', therapistId)
      .eq('is_deleted', false)
      .single()

    return data
  }

  /**
   * Update therapist
   */
  static async updateTherapist(therapistId: string, input: Partial<CreateTherapistInput>): Promise<any> {
    const updateData: any = {}

    if (input.name) updateData.name = input.name.trim()
    if (input.specialization !== undefined) updateData.specialization = input.specialization
    if (input.licenseNumber !== undefined) updateData.license_number = input.licenseNumber
    if (input.phoneNumber !== undefined) updateData.phone_number = input.phoneNumber
    if (input.email !== undefined) updateData.email = input.email

    const { data, error } = await supabaseAdmin
      .from('therapists')
      .update(updateData)
      .eq('id', therapistId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update therapist: ${error.message}`)
    return data
  }

  /**
   * Deactivate therapist
   */
  static async deactivateTherapist(therapistId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('therapists')
      .update({ is_active: false })
      .eq('id', therapistId)
      .select()
      .single()

    if (error) throw new Error(`Failed to deactivate therapist: ${error.message}`)
    return data
  }
}
