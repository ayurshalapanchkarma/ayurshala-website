import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface CreatePackageInput {
  packageName: string
  packageType?: string
  description?: string
  sessionsCount: number
  pricePerSession: number
  discountAmount?: number
  gstAmount?: number
  validityDays?: number
}

export class PackageService {
  /**
   * Create package
   */
  static async createPackage(input: CreatePackageInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.packageName?.trim()) errors.push({ field: 'packageName', message: 'Package name required' })
    if (!input.sessionsCount || input.sessionsCount <= 0) errors.push({ field: 'sessionsCount', message: 'Valid session count required' })
    if (!input.pricePerSession || input.pricePerSession <= 0) errors.push({ field: 'pricePerSession', message: 'Valid price required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const totalPrice = input.sessionsCount * input.pricePerSession
    const discountAmount = input.discountAmount || 0
    const priceAfterDiscount = totalPrice - discountAmount
    const gstAmount = input.gstAmount || (priceAfterDiscount * 0.05) // Default 5% GST
    const packageTotal = priceAfterDiscount + gstAmount

    const { data, error } = await supabaseAdmin
      .from('packages')
      .insert({
        package_name: input.packageName.trim(),
        package_type: input.packageType || null,
        description: input.description || null,
        sessions_count: input.sessionsCount,
        price_per_session: input.pricePerSession,
        total_package_price: totalPrice,
        discount_amount: discountAmount,
        gst_amount: gstAmount,
        package_total: packageTotal,
        validity_days: input.validityDays || 90,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create package: ${error.message}`)
    return data
  }

  /**
   * Get active packages
   */
  static async getActivePackages(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('package_name', { ascending: true })

    return data || []
  }

  /**
   * Get package by ID
   */
  static async getPackage(packageId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    return data
  }

  /**
   * Get patient's active packages
   */
  static async getPatientActivePackages(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('package_purchases')
      .select(`
        *,
        packages(package_name, sessions_count)
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true)

    return data || []
  }

  /**
   * Get package purchase details
   */
  static async getPackagePurchase(purchaseId: string): Promise<any> {
    const { data } = await supabaseAdmin
      .from('package_purchases')
      .select(`
        *,
        packages(package_name, price_per_session, validity_days)
      `)
      .eq('id', purchaseId)
      .single()

    return data
  }

  /**
   * Check package validity
   */
  static async isPackageValid(purchaseId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('package_purchases')
      .select('is_active, expiry_date, sessions_remaining')
      .eq('id', purchaseId)
      .single()

    if (!data) return false
    if (!data.is_active) return false
    if (data.sessions_remaining <= 0) return false

    const expiryDate = new Date(data.expiry_date)
    const today = new Date()
    return expiryDate > today
  }
}
