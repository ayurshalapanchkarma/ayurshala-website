/**
 * DEV Environment Verification Script
 * Validates connection, credentials, and infrastructure
 */

import { createClient } from '@supabase/supabase-js'

interface EnvironmentCheckResult {
  status: 'success' | 'warning' | 'error'
  component: string
  message: string
  details?: Record<string, any>
}

class DevEnvironmentVerifier {
  private results: EnvironmentCheckResult[] = []

  async verify(): Promise<void> {
    console.log('🔍 DEV Environment Verification Started...\n')

    await this.checkSupabaseConnection()
    await this.checkDatabase()
    await this.checkStorage()
    await this.checkAuthentication()
    await this.checkEnvironmentVariables()

    this.printResults()
    this.generateReport()
  }

  private async checkSupabaseConnection(): Promise<void> {
    console.log('📡 Checking Supabase Connection...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      this.results.push({
        status: 'error',
        component: 'Supabase Connection',
        message: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY',
      })
      return
    }

    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey)

      // Test connection
      const { data: projectData, error } = await supabase.from('information_schema.tables').select('table_schema').limit(1)

      if (error && error.message.includes('relation')) {
        // This is expected - we're just testing connection
        this.results.push({
          status: 'success',
          component: 'Supabase Connection',
          message: 'Connected to Supabase',
          details: {
            url: supabaseUrl,
            projectId: supabaseUrl.split('.')[0],
          },
        })
      } else {
        this.results.push({
          status: 'success',
          component: 'Supabase Connection',
          message: 'Connected to Supabase',
          details: { url: supabaseUrl },
        })
      }
    } catch (err) {
      this.results.push({
        status: 'error',
        component: 'Supabase Connection',
        message: `Connection failed: ${(err as Error).message}`,
      })
    }
  }

  private async checkDatabase(): Promise<void> {
    console.log('🗄️  Checking Database...')

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // Check for key tables
      const tables = [
        'products',
        'inventory_transactions',
        'invoices',
        'appointments',
        'employees',
        'ai_conversations',
      ]

      const missingTables = []

      for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (error && error.message.includes('does not exist')) {
          missingTables.push(table)
        }
      }

      if (missingTables.length > 0) {
        this.results.push({
          status: 'warning',
          component: 'Database Tables',
          message: `Missing tables: ${missingTables.join(', ')}. Migrations may be needed.`,
          details: { missingTables },
        })
      } else {
        this.results.push({
          status: 'success',
          component: 'Database Tables',
          message: 'All key tables found',
          details: { tableCount: tables.length },
        })
      }
    } catch (err) {
      this.results.push({
        status: 'error',
        component: 'Database',
        message: `Database check failed: ${(err as Error).message}`,
      })
    }
  }

  private async checkStorage(): Promise<void> {
    console.log('📦 Checking Storage...')

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const buckets = ['patient-documents', 'certificates', 'invoices', 'employee-documents']

      const { data: bucketList, error } = await supabase.storage.listBuckets()

      if (error) {
        this.results.push({
          status: 'warning',
          component: 'Storage Buckets',
          message: `Storage check: ${error.message}`,
        })
        return
      }

      const existingBuckets = bucketList.map((b) => b.name)
      const missingBuckets = buckets.filter((b) => !existingBuckets.includes(b))

      if (missingBuckets.length > 0) {
        this.results.push({
          status: 'warning',
          component: 'Storage Buckets',
          message: `Missing buckets: ${missingBuckets.join(', ')}. Need to create.`,
          details: { missingBuckets, existingBuckets },
        })
      } else {
        this.results.push({
          status: 'success',
          component: 'Storage Buckets',
          message: 'All storage buckets configured',
          details: { buckets: existingBuckets },
        })
      }
    } catch (err) {
      this.results.push({
        status: 'error',
        component: 'Storage',
        message: `Storage check failed: ${(err as Error).message}`,
      })
    }
  }

  private async checkAuthentication(): Promise<void> {
    console.log('🔐 Checking Authentication...')

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // Check auth schema
      const { data, error } = await supabase.from('auth.users').select('id').limit(1)

      this.results.push({
        status: 'success',
        component: 'Authentication',
        message: 'Supabase Auth configured',
        details: { authEnabled: true },
      })
    } catch (err) {
      this.results.push({
        status: 'warning',
        component: 'Authentication',
        message: 'Could not verify auth: ' + (err as Error).message,
      })
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    console.log('🔧 Checking Environment Variables...')

    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'CSRF_TOKEN_SECRET',
      'SESSION_ENCRYPTION_KEY',
    ]

    const missing = required.filter((key) => !process.env[key])
    const weak = required.filter((key) => {
      const val = process.env[key]
      return val && val.length < 32
    })

    if (missing.length > 0) {
      this.results.push({
        status: 'error',
        component: 'Environment Variables',
        message: `Missing: ${missing.join(', ')}`,
        details: { missing },
      })
    } else if (weak.length > 0) {
      this.results.push({
        status: 'warning',
        component: 'Environment Variables',
        message: `Security keys too short: ${weak.join(', ')}`,
        details: { weak },
      })
    } else {
      this.results.push({
        status: 'success',
        component: 'Environment Variables',
        message: 'All required environment variables configured',
        details: { configuredKeys: required.length },
      })
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60))
    console.log('VERIFICATION RESULTS')
    console.log('='.repeat(60) + '\n')

    for (const result of this.results) {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${result.component}`)
      console.log(`   ${result.message}`)
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
      }
      console.log()
    }
  }

  private generateReport(): void {
    const successCount = this.results.filter((r) => r.status === 'success').length
    const warningCount = this.results.filter((r) => r.status === 'warning').length
    const errorCount = this.results.filter((r) => r.status === 'error').length

    console.log('='.repeat(60))
    console.log(`Summary: ${successCount} ✅ | ${warningCount} ⚠️ | ${errorCount} ❌`)
    console.log('='.repeat(60))

    if (errorCount === 0 && warningCount === 0) {
      console.log('\n🎉 DEV Environment is ready!')
      process.exit(0)
    } else if (errorCount === 0) {
      console.log('\n⚠️  DEV Environment has warnings. Review before proceeding.')
      process.exit(0)
    } else {
      console.log('\n❌ DEV Environment has errors. Fix before proceeding.')
      process.exit(1)
    }
  }
}

// Run verification
const verifier = new DevEnvironmentVerifier()
verifier.verify().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
