/**
 * Settings Initialization - Populates clinic configuration
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function initializeSettings(): Promise<void> {
  console.log('⚙️  Initializing Settings...\n')

  try {
    // Clinic Settings
    const { error: clinicError } = await supabase.from('clinic_settings').insert({
      clinic_name: 'Ayurshala Panchakarma Clinic',
      clinic_email: 'info@ayurshalapanchakarma.com',
      clinic_phone: '+91-9876543210',
      clinic_address: 'Sector 130, Noida, Uttar Pradesh, India',
      clinic_city: 'Noida',
      clinic_state: 'Uttar Pradesh',
      clinic_country: 'India',
      clinic_postal_code: '201301',
      gst_number: '09AABCT5555K1Z0',
      gst_rate: 18,
      currency: 'INR',
      language: 'en',
      timezone: 'Asia/Kolkata',
      created_at: new Date().toISOString(),
    })

    if (clinicError) console.log('⚠️  Clinic settings:', clinicError.message)
    else console.log('✅ Clinic Settings')

    // Payment Methods
    const paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET']
    for (const method of paymentMethods) {
      await supabase.from('payment_methods').insert({
        name: method,
        is_enabled: true,
        is_deleted: false,
        created_at: new Date().toISOString(),
      })
    }
    console.log('✅ Payment Methods')

    // Tax Settings
    const taxSlabs = [
      { slab_name: '5%', rate: 5 },
      { slab_name: '12%', rate: 12 },
      { slab_name: '18%', rate: 18 },
      { slab_name: '28%', rate: 28 },
    ]
    for (const slab of taxSlabs) {
      await supabase.from('tax_settings').insert({
        ...slab,
        is_deleted: false,
        created_at: new Date().toISOString(),
      })
    }
    console.log('✅ Tax Settings')

    // Feature Flags
    const featureFlags = [
      { flag_name: 'ONLINE_PAYMENTS', is_enabled: true },
      { flag_name: 'AI_ASSISTANT', is_enabled: true },
      { flag_name: 'WEBHOOKS', is_enabled: true },
      { flag_name: 'ANALYTICS', is_enabled: true },
      { flag_name: 'MAINTENANCE_MODE', is_enabled: false },
    ]
    for (const flag of featureFlags) {
      await supabase.from('feature_flags').insert({
        ...flag,
        created_at: new Date().toISOString(),
      })
    }
    console.log('✅ Feature Flags')

    // Working Hours
    const workingHours = [
      { day_of_week: 'MON', opening_time: '09:00:00', closing_time: '18:00:00', is_working: true },
      { day_of_week: 'TUE', opening_time: '09:00:00', closing_time: '18:00:00', is_working: true },
      { day_of_week: 'WED', opening_time: '09:00:00', closing_time: '18:00:00', is_working: true },
      { day_of_week: 'THU', opening_time: '09:00:00', closing_time: '18:00:00', is_working: true },
      { day_of_week: 'FRI', opening_time: '09:00:00', closing_time: '18:00:00', is_working: true },
      { day_of_week: 'SAT', opening_time: '10:00:00', closing_time: '16:00:00', is_working: true },
      { day_of_week: 'SUN', opening_time: '10:00:00', closing_time: '14:00:00', is_working: false },
    ]
    for (const hours of workingHours) {
      await supabase.from('working_hours').insert({
        ...hours,
        created_at: new Date().toISOString(),
      })
    }
    console.log('✅ Working Hours')

    // Number Sequences
    const sequences = [
      { sequence_key: 'INV', prefix: 'INV-', format: 'YYYY-000001', current_value: 0 },
      { sequence_key: 'PO', prefix: 'PO-', format: 'YYYY-000001', current_value: 0 },
      { sequence_key: 'GRN', prefix: 'GRN-', format: 'YYYY-000001', current_value: 0 },
      { sequence_key: 'RX', prefix: 'RX-', format: 'YYYY-000001', current_value: 0 },
      { sequence_key: 'TP', prefix: 'TP-', format: 'YYYY-000001', current_value: 0 },
    ]
    for (const seq of sequences) {
      await supabase.from('number_sequences').insert({
        ...seq,
        is_deleted: false,
        created_at: new Date().toISOString(),
      })
    }
    console.log('✅ Number Sequences')

    console.log('\n' + '='.repeat(60))
    console.log('✅ SETTINGS INITIALIZED')
    console.log('='.repeat(60))
  } catch (err) {
    console.error('❌ Initialization failed:', err)
    process.exit(1)
  }
}

initializeSettings()
