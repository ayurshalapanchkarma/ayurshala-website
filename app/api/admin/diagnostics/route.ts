import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const response: any = {
    environment: process.env.NODE_ENV,
    supabase_url: supabaseUrl?.substring(0, 40) + '...',
    has_service_key: !!serviceRoleKey,
    service_key_length: serviceRoleKey?.length || 0,
    site_url: process.env.NEXT_PUBLIC_SITE_URL,
    database: {
      connection: 'FAIL',
      table_exists: false,
      table_name: 'discharge_summaries',
      row_count: null,
      select_test: false,
      error: null,
    },
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      response.database.error = 'Missing Supabase credentials'
      return NextResponse.json(response, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Test 1: Count rows
    const { count, error: countError } = await supabase
      .from('discharge_summaries')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      response.database.connection = 'FAIL'
      response.database.error = {
        code: countError.code,
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
      }
      return NextResponse.json(response, { status: 500 })
    }

    response.database.connection = 'PASS'
    response.database.table_exists = true
    response.database.row_count = count

    // Test 2: Select one row
    const { data, error: selectError } = await supabase
      .from('discharge_summaries')
      .select('id')
      .limit(1)

    if (selectError) {
      response.database.select_test = false
      response.database.error = {
        code: selectError.code,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
      }
    } else {
      response.database.select_test = true
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    response.database.error = error instanceof Error ? error.message : String(error)
    return NextResponse.json(response, { status: 500 })
  }
}

