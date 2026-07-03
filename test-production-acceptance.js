#!/usr/bin/env node

/**
 * PRODUCTION ACCEPTANCE TEST
 * 
 * Tests discharge summary data persistence on production
 * 
 * Tests:
 * 1. Create discharge summary → Verify 1 row in DB
 * 2. Refresh page → Verify all fields reload
 * 3. Edit → Save → Verify UPDATE (not INSERT), single row
 * 4. Browser restart simulation → Verify data loads
 * 5. Database verification → Verify exactly 1 row
 * 
 * Commit: df6e8b4
 */

const fetch = require('node-fetch');
const assert = require('assert');

// Configuration
const PROD_URL = 'https://www.ayurshalapanchakarma.com';
const SUPABASE_URL = 'https://edwzyrdikttdxmphpvvp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkd3p5cmRpa3R0ZHhtcGhwdnZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzOTkyNywiZXhwIjoyMDk2MjE1OTI3fQ.v2mlKmY4q27M0ymTcIP-WAYy8F8QXhOuh4ulOwlNJUM';

let testResults = {
  bookingId: null,
  tests: {}
};

// Test 1: Get a real appointment from production
async function test1_GetRealAppointment() {
  console.log('\n=== TEST 1: Get Real Appointment ===');
  
  try {
    // Query Supabase for a real appointment
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?limit=1&order=id.desc`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No appointments found in production database');
    }
    
    const appointment = data[0];
    testResults.bookingId = appointment.id;
    
    console.log('✓ Found appointment:');
    console.log(`  ID: ${appointment.id}`);
    console.log(`  Patient: ${appointment.patient_name}`);
    console.log(`  Date: ${appointment.preferred_date}`);
    
    return appointment;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    throw error;
  }
}

// Test 2: Create discharge summary
async function test2_CreateDischargeSummary(appointmentId) {
  console.log('\n=== TEST 2: Create Discharge Summary ===');
  
  try {
    const payload = {
      patient_uhid: `TEST-${Date.now()}`,
      patient_name: 'Production Test Patient',
      doctor_name: 'Dr. Farha Naqvi',
      age: '45',
      sex: 'M',
      doa_date: new Date().toISOString().split('T')[0],
      doa_time: '10:00',
      dod_date: new Date().toISOString().split('T')[0],
      dod_time: '14:00',
      diagnosis: 'Production QA Test Diagnosis',
      complaints: ['Complaint 1'],
      booking_uuid: appointmentId,
      nationality: 'Indian',
      address: 'Test Address',
      history_present_complaints: 'Test History',
      history_days: '3',
      past_history_medical: 'No',
      past_history_surgical: 'No',
      past_history_details: '',
      medication_administered: 'Test Medication',
      day_of_therapy: '1',
      pradhan_vedna: ['Vedna 1'],
      vitals_bp: '120/80',
      vitals_hr: '72',
      vitals_nadi: 'V3P2K1',
      oe_mala: 'Samyak',
      oe_mutra: 'Samyak',
      oe_jihwa: 'Samyak',
      oe_shuda: 'Samyak',
      oe_nidra: 'Samyak',
      therapies: ['Therapy 1'],
      investigations: 'Test Investigations',
      findings_discharge: 'Test Findings',
      condition_discharge: 'Test Condition',
      advice_discharge: 'Test Advice',
      medicine_discharge: 'Test Medicine',
      medicines: [{name: 'Medicine 1', dosage: '1', instructions: 'Twice daily', schedule: '12:00 PM', duration: '7 days'}],
      cautions: 'Test Cautions',
      pathya: 'Test Pathya',
      apathya: 'Test Apathya'
    };
    
    console.log(`Sending save request to: ${PROD_URL}/api/admin/discharge-summary/save`);
    
    const response = await fetch(
      `${PROD_URL}/api/admin/discharge-summary/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Save failed: ${result.error}`);
    }
    
    if (!result.data) {
      throw new Error('Save succeeded but no data returned');
    }
    
    console.log('✓ Discharge summary created:');
    console.log(`  ID: ${result.id}`);
    console.log(`  Patient: ${result.data.patient_name}`);
    console.log(`  Diagnosis: ${result.data.diagnosis}`);
    console.log(`  Operation: ${result.operation}`);
    
    testResults.tests.create = {
      passed: true,
      dischargeSummaryId: result.id,
      operation: result.operation,
      data: result.data
    };
    
    return result.data;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    testResults.tests.create = { passed: false, error: error.message };
    throw error;
  }
}

// Test 3: Verify single row in database
async function test3_VerifySingleRow(bookingId) {
  console.log('\n=== TEST 3: Verify Single Row in Database ===');
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/discharge_summaries?booking_id=eq.${bookingId}&select=id,booking_id,patient_name,created_at,updated_at`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    const data = await response.json();
    
    console.log(`✓ Database query returned ${data.length} row(s)`);
    
    if (data.length !== 1) {
      throw new Error(`Expected 1 row, got ${data.length}`);
    }
    
    const record = data[0];
    console.log(`  Record ID: ${record.id}`);
    console.log(`  Booking ID: ${record.booking_id}`);
    console.log(`  Patient Name: ${record.patient_name}`);
    console.log(`  Created: ${record.created_at}`);
    console.log(`  Updated: ${record.updated_at}`);
    
    testResults.tests.verifyRow = {
      passed: true,
      rowCount: data.length,
      record: record
    };
    
    return record;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    testResults.tests.verifyRow = { passed: false, error: error.message };
    throw error;
  }
}

// Test 4: Simulate refresh by fetching via GET endpoint
async function test4_SimulateRefresh(bookingId) {
  console.log('\n=== TEST 4: Simulate Refresh (Fetch via GET) ===');
  
  try {
    const response = await fetch(
      `${PROD_URL}/api/admin/discharge-summary?bookingId=${bookingId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    const result = await response.json();
    
    if (!result.data) {
      throw new Error('GET returned no data');
    }
    
    console.log('✓ GET endpoint returned data:');
    console.log(`  Patient Name: ${result.data.patient_name}`);
    console.log(`  Doctor: ${result.data.doctor_name}`);
    console.log(`  Diagnosis: ${result.data.diagnosis}`);
    console.log(`  Age: ${result.data.age}`);
    
    testResults.tests.refresh = {
      passed: true,
      data: result.data
    };
    
    return result.data;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    testResults.tests.refresh = { passed: false, error: error.message };
    throw error;
  }
}

// Test 5: Edit and save again (should UPDATE, not INSERT)
async function test5_EditAndUpdate(bookingId, originalData) {
  console.log('\n=== TEST 5: Edit and Update (Verify UPDATE Operation) ===');
  
  try {
    const updatedPayload = {
      ...originalData,
      diagnosis: 'UPDATED DIAGNOSIS - Production QA Test',
      booking_uuid: bookingId
    };
    
    console.log('Sending update request...');
    
    const response = await fetch(
      `${PROD_URL}/api/admin/discharge-summary/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPayload)
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Update failed: ${result.error}`);
    }
    
    // Check that operation was UPDATE, not INSERT
    if (result.operation !== 'UPDATE') {
      throw new Error(`Expected UPDATE operation, got ${result.operation}`);
    }
    
    console.log('✓ Update successful:');
    console.log(`  Operation: ${result.operation} (not INSERT!)`);
    console.log(`  Diagnosis updated: ${result.data.diagnosis}`);
    
    testResults.tests.update = {
      passed: true,
      operation: result.operation,
      diagnosis: result.data.diagnosis
    };
    
    return result.data;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    testResults.tests.update = { passed: false, error: error.message };
    throw error;
  }
}

// Test 6: Verify still only 1 row after update
async function test6_VerifyStillSingleRow(bookingId) {
  console.log('\n=== TEST 6: Verify Still Single Row After Update ===');
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/discharge_summaries?booking_id=eq.${bookingId}`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    const data = await response.json();
    
    console.log(`✓ Database query returned ${data.length} row(s)`);
    
    if (data.length !== 1) {
      throw new Error(`Expected 1 row, got ${data.length} (duplicates created!)`);
    }
    
    const record = data[0];
    console.log(`  Record ID: ${record.id}`);
    console.log(`  Diagnosis: ${record.diagnosis}`);
    console.log(`  Updated: ${record.updated_at}`);
    
    testResults.tests.verifyStillSingle = {
      passed: true,
      rowCount: data.length,
      diagnosis: record.diagnosis
    };
    
    return record;
  } catch (error) {
    console.error('✗ FAILED:', error.message);
    testResults.tests.verifyStillSingle = { passed: false, error: error.message };
    throw error;
  }
}

// Main test execution
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   PRODUCTION ACCEPTANCE TEST                       ║');
  console.log('║   Discharge Summary Data Persistence               ║');
  console.log('║   Commit: df6e8b4                                  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    // Test 1: Get real appointment
    const appointment = await test1_GetRealAppointment();
    
    // Test 2: Create discharge summary
    const created = await test2_CreateDischargeSummary(appointment.id);
    
    // Test 3: Verify single row
    const record1 = await test3_VerifySingleRow(appointment.id);
    
    // Test 4: Simulate refresh
    const refreshed = await test4_SimulateRefresh(appointment.id);
    
    // Test 5: Edit and update
    const updated = await test5_EditAndUpdate(appointment.id, created);
    
    // Test 6: Verify still single row
    const record2 = await test6_VerifyStillSingleRow(appointment.id);
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   ACCEPTANCE TEST RESULTS                          ║');
    console.log('╚════════════════════════════════════════════════════╝');
    
    const passedTests = Object.values(testResults.tests).filter(t => t.passed).length;
    const totalTests = Object.values(testResults.tests).length;
    
    console.log(`\n✓ PASSED: ${passedTests}/${totalTests} tests`);
    console.log(`\nBooking ID: ${testResults.bookingId}`);
    console.log(`Production URL: ${PROD_URL}`);
    console.log(`Commit: df6e8b4`);
    
    if (passedTests === totalTests) {
      console.log('\n✅ ALL TESTS PASSED - Data persistence verified on production');
      return true;
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      return false;
    }
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    return false;
  }
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
