import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface SettingPayload {
  key: string
  value: string | number | boolean
  type?: 'text' | 'number' | 'boolean' | 'json'
  description?: string
}

/**
 * GET /api/inventory/settings/general
 * Fetch all general inventory settings from inv_settings table
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('inv_settings')
      .select('*')
      .eq('is_active', true)
      .order('setting_key', { ascending: true })

    if (error) throw error

    // Transform to key-value format
    const settings = (data || []).reduce((acc: Record<string, any>, row: any) => {
      acc[row.setting_key] = row.setting_value
      return acc
    }, {})

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[Settings GET Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/settings/general
 * Update inventory settings
 * Body: { key: string, value: any, type?: string, description?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body: SettingPayload = await request.json()
    const { key, value, type = 'text', description } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    // Check if setting exists
    const { data: existing, error: existError } = await supabaseAdmin
      .from('inv_settings')
      .select('uuid')
      .eq('setting_key', key)
      .single()

    if (existError && existError.code !== 'PGRST116') throw existError

    let result
    let opError

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('inv_settings')
        .update({
          setting_value: String(value),
          setting_type: type,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', key)
        .select()

      result = data
      opError = error
    } else {
      // Insert new
      const { data, error } = await supabaseAdmin
        .from('inv_settings')
        .insert({
          setting_key: key,
          setting_value: String(value),
          setting_type: type,
          description,
          is_active: true,
        })
        .select()

      result = data
      opError = error
    }

    if (opError) throw opError

    return NextResponse.json({
      success: true,
      message: 'Setting saved successfully',
      data: result,
    })
  } catch (error) {
    console.error('[Settings POST Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save setting' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/settings/general
 * Bulk update multiple settings
 * Body: { settings: { key: value, ... } }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    // Upsert all settings
    const results = []
    for (const [key, value] of Object.entries(settings)) {
      const { data: existing } = await supabaseAdmin
        .from('inv_settings')
        .select('uuid')
        .eq('setting_key', key)
        .single()

      let result
      let error

      if (existing) {
        const response = await supabaseAdmin
          .from('inv_settings')
          .update({
            setting_value: String(value),
            updated_at: new Date().toISOString(),
          })
          .eq('setting_key', key)
          .select()

        result = response.data
        error = response.error
      } else {
        const response = await supabaseAdmin
          .from('inv_settings')
          .insert({
            setting_key: key,
            setting_value: String(value),
            setting_type: 'text',
            is_active: true,
          })
          .select()

        result = response.data
        error = response.error
      }

      if (error) throw error
      results.push(...(result || []))
    }

    return NextResponse.json({
      success: true,
      message: `${Object.keys(settings).length} settings saved`,
      data: results,
    })
  } catch (error) {
    console.error('[Settings PUT Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    )
  }
}
