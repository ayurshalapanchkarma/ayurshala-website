/**
 * System Users Seeder
 * Creates demo users with proper RBAC for testing
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface DemoUser {
  email: string
  password: string
  fullName: string
  role: string
  phone?: string
}

const demoUsers: DemoUser[] = [
  {
    email: 'superadmin@ayurshala.local',
    password: 'SuperAdmin@123456',
    fullName: 'Super Administrator',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'admin@ayurshala.local',
    password: 'Admin@123456',
    fullName: 'Administrator',
    role: 'ADMIN',
  },
  {
    email: 'doctor@ayurshala.local',
    password: 'Doctor@123456',
    fullName: 'Dr. Amit Kumar',
    role: 'DOCTOR',
    phone: '9876543210',
  },
  {
    email: 'therapist@ayurshala.local',
    password: 'Therapist@123456',
    fullName: 'Therapist Priya',
    role: 'THERAPIST',
    phone: '9876543211',
  },
  {
    email: 'reception@ayurshala.local',
    password: 'Reception@123456',
    fullName: 'Reception Deepak',
    role: 'RECEPTION',
  },
  {
    email: 'pharmacist@ayurshala.local',
    password: 'Pharmacist@123456',
    fullName: 'Pharmacist Rahul',
    role: 'PHARMACIST',
  },
  {
    email: 'finance@ayurshala.local',
    password: 'Finance@123456',
    fullName: 'Finance Manager',
    role: 'FINANCE',
  },
  {
    email: 'hr@ayurshala.local',
    password: 'HR@123456',
    fullName: 'HR Manager',
    role: 'HR',
  },
  {
    email: 'patient@ayurshala.local',
    password: 'Patient@123456',
    fullName: 'Patient Demo',
    role: 'PATIENT',
  },
]

async function seedSystemUsers(): Promise<void> {
  console.log('👥 Creating System Users...\n')

  const createdUsers = []

  for (const user of demoUsers) {
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      })

      if (authError) {
        console.log(`❌ Failed to create ${user.email}: ${authError.message}`)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authUser?.user?.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        phone: user.phone || null,
        status: 'active',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.log(`⚠️  Created auth but profile failed for ${user.email}: ${profileError.message}`)
        continue
      }

      console.log(`✅ ${user.role.padEnd(12)} | ${user.email}`)
      createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
      })
    } catch (err) {
      console.log(`❌ Error creating ${user.email}:`, (err as Error).message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('DEFAULT USERS CREATED')
  console.log('='.repeat(60))
  console.log('\nFor Testing (Change passwords immediately in production):\n')

  createdUsers.forEach((user) => {
    console.log(`${user.role.padEnd(14)} | Email: ${user.email}`)
    console.log(`${''.padEnd(14)} | Pass:  ${user.password}\n`)
  })

  console.log('='.repeat(60))
}

seedSystemUsers().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
