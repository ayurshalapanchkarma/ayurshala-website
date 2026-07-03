/**
 * Verification script to fetch real discharge summaries
 * Run: node verify-discharge-summaries.js
 */

const https = require('https');

const SUPABASE_URL = 'edwzyrdikttdxmphpvvp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkd3p5cmRpa3R0ZHhtcGhwdnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzOTkyNywiZXhwIjoyMDk2MjE1OTI3fQ.v2mlKmY4q27M0ymTcIP-WAYy8F8QXhOuh4ulOwlNJUM';

function fetchDischargeSummaries() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/discharge_summaries?select=*&limit=10&order=updated_at.desc',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('Fetching discharge summaries...\n');
    const summaries = await fetchDischargeSummaries();
    
    if (!summaries || summaries.length === 0) {
      console.log('❌ No discharge summaries found in database');
      process.exit(1);
    }

    console.log(`✓ Found ${summaries.length} discharge summaries\n`);

    summaries.forEach((s, i) => {
      console.log(`${i + 1}. ${s.patient_name} (${s.patient_uhid})`);
      console.log(`   Booking UUID: ${s.booking_id}`);
      console.log(`   Booking Number: ${s.booking_number || '—'}`);
      console.log(`   Doctor: ${s.doctor_name}`);
      console.log(`   Diagnosis: ${s.diagnosis?.substring(0, 60)}...`);
      console.log(`   Created: ${s.created_at}`);
      console.log(`   Medicines: ${s.medicines?.length || 0}`);
      console.log(`   Therapies: ${s.therapies?.length || 0}`);
      
      // Show preview URL
      console.log(`   Preview URL:\n   http://localhost:3000/admin/pdf-preview?booking_uuid=${s.booking_id}\n`);
    });

    console.log('\n✓ Use one of the Preview URLs above for visual QA');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
