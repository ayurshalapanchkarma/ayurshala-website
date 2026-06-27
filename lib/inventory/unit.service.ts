import { supabaseAdmin } from '@/lib/supabase-admin'

export interface Unit {
  id: string
  name: string
  symbol: string
  base_unit?: string
  conversion_factor: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  created_at: string
  updated_at: string
}

export class UnitService {
  static async getUnits(activeOnly = true): Promise<Unit[]> {
    let query = supabaseAdmin.from('inventory_units').select('*').order('name')

    if (activeOnly) query = query.eq('status', 'ACTIVE')

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch units: ${error.message}`)
    return data || []
  }

  static async getUnitById(id: string): Promise<Unit> {
    const { data, error } = await supabaseAdmin
      .from('inventory_units')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Unit not found: ${error.message}`)
    if (!data) throw new Error('Unit not found')
    return data
  }
}
