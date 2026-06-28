import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// This endpoint is for ADMIN ONLY and should only be run once
// It executes the inventory_core.sql migration

export async function POST(request: Request) {
  try {
    // SECURITY: In production, verify admin token
    const auth = request.headers.get('authorization')
    const token = auth?.replace('Bearer ', '')
    
    if (token !== process.env.ADMIN_CONFIRM_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Create a client with service role (can execute any SQL)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'inventory_core.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('[MIGRATION] Starting inventory_core.sql execution')
    console.log(`[MIGRATION] SQL file size: ${(sql.length / 1024).toFixed(2)} KB`)

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`[MIGRATION] Found ${statements.length} statements`)

    let executedCount = 0
    let errors: { statement: number; error: string }[] = []

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      const stmtNum = i + 1

      try {
        // Extract table/index name for logging
        const tableMatch = 
          stmt.match(/CREATE TABLE.*?(\w+)\s*\(/i) ||
          stmt.match(/CREATE INDEX.*?(\w+)/i) ||
          stmt.match(/CREATE.*?VIEW\s+(\w+)/i)
        const label = tableMatch ? tableMatch[1] : stmt.substring(0, 40)

        console.log(`[MIGRATION] [${stmtNum}/${statements.length}] Executing: ${label}`)

        // Execute SQL using raw query - using rpc approach
        const { error: execError } = await supabase.rpc('exec', {
          sql: stmt
        })

        if (execError && execError.message && !execError.message.includes('not found')) {
          throw new Error(execError.message)
        }

        executedCount++
        console.log(`[MIGRATION] [${stmtNum}/${statements.length}] ✅ Success`)
      } catch (err: any) {
        const errMsg = err.message || String(err)
        console.error(`[MIGRATION] [${stmtNum}/${statements.length}] ❌ Error: ${errMsg}`)
        errors.push({
          statement: stmtNum,
          error: errMsg
        })
      }
    }

    console.log(`[MIGRATION] Complete. Executed: ${executedCount}/${statements.length}`)

    if (errors.length > 0) {
      console.error(`[MIGRATION] ${errors.length} errors encountered`)
      return NextResponse.json(
        {
          success: false,
          executed: executedCount,
          total: statements.length,
          errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      executed: executedCount,
      total: statements.length,
      message: 'Migration completed successfully'
    })
  } catch (err: any) {
    console.error('[MIGRATION] Fatal error:', err)
    return NextResponse.json(
      {
        error: err.message || 'Migration failed'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  // Safety: GET shows status only
  return NextResponse.json({
    message: 'Inventory migration endpoint',
    method: 'POST',
    auth: 'Bearer ADMIN_CONFIRM_SECRET'
  })
}
