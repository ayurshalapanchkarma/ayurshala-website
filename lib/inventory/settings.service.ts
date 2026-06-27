import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface ClinicSettingsInput {
  clinicName: string
  legalName?: string
  gstin?: string
  pan?: string
  registrationNumber?: string
  logoUrl?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  timezone?: string
  currency?: string
  language?: string
}

export interface NumberSequenceInput {
  sequenceName: string
  sequenceFormat: string
  resetType?: string
}

export class SettingsService {
  /**
   * Get clinic settings
   */
  static async getClinicSettings(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('clinic_settings')
      .select('*')
      .single()

    return data
  }

  /**
   * Update clinic settings
   */
  static async updateClinicSettings(input: ClinicSettingsInput): Promise<any> {
    const updateData: any = {}

    if (input.clinicName) updateData.clinic_name = input.clinicName
    if (input.legalName !== undefined) updateData.legal_name = input.legalName
    if (input.gstin !== undefined) updateData.gstin = input.gstin
    if (input.pan !== undefined) updateData.pan = input.pan
    if (input.registrationNumber !== undefined) updateData.registration_number = input.registrationNumber
    if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl
    if (input.address !== undefined) updateData.address = input.address
    if (input.city !== undefined) updateData.city = input.city
    if (input.state !== undefined) updateData.state = input.state
    if (input.postalCode !== undefined) updateData.postal_code = input.postalCode
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.email !== undefined) updateData.email = input.email
    if (input.website !== undefined) updateData.website = input.website
    if (input.timezone !== undefined) updateData.timezone = input.timezone
    if (input.currency !== undefined) updateData.currency = input.currency
    if (input.language !== undefined) updateData.language = input.language

    const { data, error } = await supabaseAdmin
      .from('clinic_settings')
      .update(updateData)
      .select()
      .single()

    if (error) throw new Error(`Failed to update clinic settings: ${error.message}`)
    return data
  }

  /**
   * Get number sequence
   */
  static async getNumberSequence(sequenceName: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('number_sequences')
      .select('*')
      .eq('sequence_name', sequenceName)
      .eq('is_active', true)
      .single()

    return data
  }

  /**
   * Create number sequence
   */
  static async createNumberSequence(input: NumberSequenceInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.sequenceName?.trim()) errors.push({ field: 'sequenceName', message: 'Sequence name required' })
    if (!input.sequenceFormat?.trim()) errors.push({ field: 'sequenceFormat', message: 'Sequence format required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('number_sequences')
      .insert({
        sequence_name: input.sequenceName,
        sequence_format: input.sequenceFormat,
        reset_type: input.resetType || 'YEARLY',
        current_value: 0,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create sequence: ${error.message}`)
    return data
  }

  /**
   * Get all sequences
   */
  static async getAllSequences(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('number_sequences')
      .select('*')
      .eq('is_active', true)

    return data || []
  }

  /**
   * Get working hours
   */
  static async getWorkingHours(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('working_hours')
      .select('*')
      .order('day_of_week', { ascending: true })

    return data || []
  }

  /**
   * Update working hours
   */
  static async updateWorkingHours(dayOfWeek: number, input: any): Promise<any> {
    const { data: existing } = await supabaseAdmin
      .from('working_hours')
      .select('id')
      .eq('day_of_week', dayOfWeek)
      .single()

    if (existing) {
      const { data } = await supabaseAdmin
        .from('working_hours')
        .update(input)
        .eq('day_of_week', dayOfWeek)
        .select()
        .single()

      return data
    }

    const { data } = await supabaseAdmin
      .from('working_hours')
      .insert({ day_of_week: dayOfWeek, ...input })
      .select()
      .single()

    return data
  }

  /**
   * Get holiday calendar
   */
  static async getHolidayCalendar(fromDate?: string, toDate?: string): Promise<any[]> {
    let query = supabaseAdmin.from('holiday_calendar').select('*')

    if (fromDate) query = query.gte('holiday_date', fromDate)
    if (toDate) query = query.lte('holiday_date', toDate)

    const { data } = await query.order('holiday_date', { ascending: true })

    return data || []
  }

  /**
   * Add holiday
   */
  static async addHoliday(holidayDate: string, holidayName: string, input?: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('holiday_calendar')
      .insert({
        holiday_date: holidayDate,
        holiday_name: holidayName,
        holiday_type: input?.holidayType || 'CLINIC_HOLIDAY',
        is_clinic_closed: input?.isClinicClosed !== false,
        affected_doctors: input?.affectedDoctors || null,
        affected_therapists: input?.affectedTherapists || null,
        notes: input?.notes || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to add holiday: ${error.message}`)
    return data
  }

  /**
   * Get roles
   */
  static async getRoles(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('is_active', true)

    return data || []
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId)

    return data?.map((rp: any) => rp.permissions) || []
  }

  /**
   * Assign permission to role
   */
  static async assignPermission(roleId: string, permissionId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
      })
      .select()
      .single()

    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to assign permission: ${error.message}`)
    }

    return data
  }

  /**
   * Get feature flags
   */
  static async getFeatureFlags(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('feature_flags')
      .select('*')
      .eq('is_enabled', true)

    return data || []
  }

  /**
   * Check feature flag
   */
  static async isFeatureEnabled(featureKey: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('feature_flags')
      .select('is_enabled, rollout_percentage')
      .eq('feature_key', featureKey)
      .eq('is_enabled', true)
      .single()

    return data?.is_enabled || false
  }

  /**
   * Get payment methods
   */
  static async getPaymentMethods(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('is_enabled', true)

    return data || []
  }

  /**
   * Get tax settings
   */
  static async getTaxSettings(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('tax_settings')
      .select('*')
      .eq('is_active', true)

    return data || []
  }

  /**
   * Get notification templates
   */
  static async getNotificationTemplates(channel?: string): Promise<any[]> {
    let query = supabaseAdmin.from('notification_templates').select('*').eq('is_active', true)

    if (channel) query = query.eq('channel', channel)

    const { data } = await query

    return data || []
  }

  /**
   * Get template by code
   */
  static async getTemplateByCode(templateCode: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('template_code', templateCode)
      .single()

    return data
  }

  /**
   * Get branding
   */
  static async getBranding(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('branding')
      .select('*')
      .single()

    return data
  }

  /**
   * Update branding
   */
  static async updateBranding(input: any): Promise<any> {
    const { data } = await supabaseAdmin
      .from('branding')
      .update(input)
      .select()
      .single()

    return data
  }

  /**
   * Get departments
   */
  static async getDepartments(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('is_active', true)

    return data || []
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<any> {
    const { data } = await supabaseAdmin.from('system_settings').select('*')

    const settings: Record<string, any> = {}
    for (const s of data || []) {
      settings[s.setting_key] = s.setting_value
    }

    return settings
  }

  /**
   * Update system setting
   */
  static async updateSystemSetting(key: string, value: any): Promise<void> {
    const { data: existing } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .eq('setting_key', key)
      .single()

    if (existing) {
      await supabaseAdmin
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
    } else {
      await supabaseAdmin
        .from('system_settings')
        .insert({ setting_key: key, setting_value: value })
    }
  }
}
