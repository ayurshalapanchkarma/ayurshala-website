'use client'
import { useState, useEffect } from 'react'
import { DischargeSummaryTemplate, type DischargeSummaryData } from '@/components/pdf/DischargeSummaryTemplate'
import '@/styles/pdf.css'

/**
 * PDF Preview Page
 * 
 * This page renders the discharge summary template in the browser.
 * Use it to verify layout, spacing, tables, and page breaks BEFORE
 * integrating Puppeteer.
 * 
 * Usage:
 * 
 * Development Mode (mock data):
 *   /admin/pdf-preview
 *   Shows comprehensive test data for layout testing
 * 
 * Production Mode (real data):
 *   /admin/pdf-preview?booking_uuid=<uuid>
 *   Loads actual saved discharge summary from database
 *   Ideal for verifying exact production documents
 * 
 * To test:
 * 1. Open the URL (with or without booking_uuid)
 * 2. Review the layout — should look like a professional hospital document
 * 3. Test print: Ctrl+P / Cmd+P → Print to PDF
 * 4. Verify page breaks, tables, signatures look correct
 * 5. Once satisfied, Puppeteer will generate the same PDF automatically
 */

// Sample test data — used when no booking_uuid is provided
const testData: DischargeSummaryData = {
  patient_uhid: 'AYP-2026-000042',
  patient_name: 'Rajesh Kumar Singh',
  age: '45',
  sex: 'M',
  nationality: 'Indian',
  address: '123 Main Street, Mumbai, Maharashtra 400001, India',

  doa_date: '2026-06-15',
  doa_time: '10:30',
  dod_date: '2026-07-03',
  dod_time: '14:45',

  diagnosis: 'Chronic knee pain with Vata aggravation. Osteoarthritis left knee with referred pain to lower back.',
  complaints: [
    'Severe pain in left knee joint',
    'Stiffness in the morning lasting 30-45 minutes',
    'Swelling in the joint area',
    'Difficulty in climbing stairs',
    'Referred pain radiating to lower back and hip',
  ],

  history_present_complaints:
    'The patient is a 45-year-old male presenting with a history of chronic knee pain for the past 3 years. Pain has progressively worsened over the last 6 months, especially with physical activity. Patient reports morning stiffness lasting about 30-45 minutes. There is visible swelling in the left knee joint that increases with activity. The pain radiates from the knee to the lower back and hip, particularly on rainy days. Patient has been unable to participate in his regular exercise routine and has difficulty climbing stairs and squatting. Previous treatment with NSAIDs provided only temporary relief.',
  history_days: '3 years (recent exacerbation: 6 months)',

  past_history_medical: 'No significant medical history. No diabetes, hypertension, or cardiac conditions.',
  past_history_surgical: 'No previous surgeries. No orthopedic interventions.',
  past_history_details:
    'Patient works in an IT company with mostly sedentary work. Lifestyle is relatively sedentary with minimal physical activity. Diet consists of regular Indian food with occasional fried items. Sleep pattern is regular, 7-8 hours per night.',

  medication_administered:
    'Tablets: Ashwagandha (600mg), Guggulu (500mg), Turmeric extract (400mg). Oils: Mahanarayan oil for massage. Topical: Warm compresses with medicated oils.',

  day_of_therapy: '18 days of in-house Panchakarma treatment',

  pradhan_vedna: [
    'Acute joint pain in left knee',
    'Morning stiffness affecting daily activities',
    'Referred pain to lower back and hip',
    'Swelling in knee joint',
  ],

  vitals_bp: '130/80 mmHg',
  vitals_hr: '72 bpm',
  vitals_nadi: 'Irregular Vata pulse (60-70 rpm)',

  oe_mala: 'Samyak (normal)',
  oe_mutra: 'Samyak (normal)',
  oe_jihwa: 'Slight coating (normal)',
  oe_shuda: 'Samyak (normal)',
  oe_nidra: 'Good',

  therapies: [
    'Abhyanga (oil massage) - daily',
    'Basti (medicated enema) - alternate days',
    'Pinda Sweda (herbal poultice fomentation) - daily',
    'Rasna Saptaka Kwatha - oral medication',
    'Ksheerabala Taila - topical application',
  ],

  investigations: 'X-Ray left knee (PA and lateral views) shows Grade 2 osteoarthritis. No acute fracture or dislocation.',

  findings_discharge:
    'Patient shows marked improvement in pain levels (from 8/10 to 3/10). Swelling has reduced by approximately 60%. Morning stiffness duration reduced to 10-15 minutes. Patient is now able to climb stairs with minimal discomfort and walk for 30-45 minutes without significant pain.',

  condition_discharge: 'Patient discharged in improved condition. Advised to continue with home management and lifestyle modifications.',

  advice_discharge:
    'Continue taking prescribed medications for the next 3 months. Perform daily Abhyanga with warm sesame oil. Maintain a warm environment and avoid cold exposure. Gradually increase physical activity — start with light walking and gentle yoga. Attend follow-up after 4 weeks.',

  medicine_discharge:
    'Ashwagandha tablets (600mg, twice daily after food). Guggulu tablets (500mg, twice daily). Turmeric extract (400mg, once daily). Ksheerabala Taila for massage (every evening).',

  medicines: [
    { name: 'Ashwagandha (Withania somnifera)', dosage: '600mg', instructions: 'Twice daily with warm milk', schedule: 'Morning and Evening', duration: '90 days' },
    { name: 'Guggulu (Commiphora wightii)', dosage: '500mg', instructions: 'With warm water', schedule: 'After breakfast and dinner', duration: '90 days' },
    { name: 'Turmeric Extract (Curcuma longa)', dosage: '400mg', instructions: 'With honey', schedule: 'Once daily in morning', duration: '60 days' },
    { name: 'Rasna Saptaka Kwatha', dosage: '30ml', instructions: 'Mixed with warm water', schedule: 'Twice daily before meals', duration: '45 days' },
    { name: 'Ksheerabala Taila', dosage: 'For massage', instructions: 'Warm and apply to knee joint', schedule: 'Every evening before bed', duration: 'As needed' },
    { name: 'Brahmi Ghrita', dosage: '5ml', instructions: 'On an empty stomach', schedule: 'Once daily in morning', duration: '30 days' },
    { name: 'Triphala Churna', dosage: '5g', instructions: 'Mixed with warm water', schedule: 'Before sleep', duration: 'Ongoing' },
    { name: 'Dashamoola Kwatha', dosage: '30ml', instructions: 'With honey', schedule: 'Twice daily', duration: '30 days' },
    { name: 'Mahanarayan Taila', dosage: 'For massage', instructions: 'Warm massage to affected area', schedule: 'Every morning', duration: 'As needed' },
    { name: 'Ginger tea', dosage: '1-2 cups', instructions: 'Fresh ginger with honey', schedule: 'Twice daily', duration: 'Daily' },
  ],

  cautions: 'Avoid heavy foods, cold water, and strenuous exercise. Do not sit in air-conditioned environments for extended periods. Avoid sleeping on hard surfaces. Do not lift heavy objects with the affected leg.',

  pathya:
    'Include warm, easily digestible foods. Ghee, warm milk, sesame oil are beneficial. Light soups, cooked vegetables, and herbal teas are recommended. Regular warm oil massage maintains Vata balance.',

  apathya:
    'Avoid cold foods and drinks, raw salads, fermented foods, and heavy meals. No ice cream, cold water, or carbonated beverages. Avoid caffeine and excess tea. No strenuous exercise or high-impact activities.',

  doctor_name: 'Dr. Farha Naqvi',
  booking_number: 'AYB-2026-000052',
}

export default function PDFPreviewPage() {
  const [showPrintHint, setShowPrintHint] = useState(true)
  const [data, setData] = useState<DischargeSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingUuid, setBookingUuid] = useState<string | null>(null)
  const [mode, setMode] = useState<'dev' | 'production'>('dev')

  // Load real data if booking_uuid is provided
  useEffect(() => {
    // Read booking_uuid from URL
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('booking_uuid')

    if (uuid) {
      setBookingUuid(uuid)
      setMode('production')
      loadRealData(uuid)
    } else {
      // Use mock test data
      setMode('dev')
      setData(testData)
    }
  }, [])

  async function loadRealData(uuid: string) {
    setLoading(true)
    setError(null)

    try {
      // Fetch the discharge summary
      const res = await fetch(`/api/admin/discharge-summary?booking_uuid=${encodeURIComponent(uuid)}`)

      if (!res.ok) {
        const errorBody = await res.json()
        setError(errorBody.error || 'Failed to load discharge summary')
        setLoading(false)
        return
      }

      const { data: summary } = await res.json()

      if (!summary) {
        setError('No saved discharge summary found for this booking.')
        setLoading(false)
        return
      }

      // Transform database record to DischargeSummaryData format
      const transformedData: DischargeSummaryData = {
        patient_uhid: summary.patient_uhid || '',
        patient_name: summary.patient_name || '',
        age: summary.age || '',
        sex: summary.sex || '',
        nationality: summary.nationality || 'Indian',
        address: summary.address || '',
        doa_date: summary.doa_date || '',
        doa_time: summary.doa_time || '',
        dod_date: summary.dod_date || '',
        dod_time: summary.dod_time || '',
        diagnosis: summary.diagnosis || '',
        complaints: summary.complaints || [],
        history_present_complaints: summary.history_present_complaints || '',
        history_days: summary.history_days || '',
        past_history_medical: summary.past_history_medical || '',
        past_history_surgical: summary.past_history_surgical || '',
        past_history_details: summary.past_history_details || '',
        medication_administered: summary.medication_administered || '',
        day_of_therapy: summary.day_of_therapy || '',
        pradhan_vedna: summary.pradhan_vedna || [],
        vitals_bp: summary.vitals_bp || '',
        vitals_hr: summary.vitals_hr || '',
        vitals_nadi: summary.vitals_nadi || '',
        oe_mala: summary.oe_mala || '',
        oe_mutra: summary.oe_mutra || '',
        oe_jihwa: summary.oe_jihwa || '',
        oe_shuda: summary.oe_shuda || '',
        oe_nidra: summary.oe_nidra || '',
        therapies: summary.therapies || [],
        investigations: summary.investigations || '',
        findings_discharge: summary.findings_discharge || '',
        condition_discharge: summary.condition_discharge || '',
        advice_discharge: summary.advice_discharge || '',
        medicine_discharge: summary.medicine_discharge || '',
        medicines: summary.medicines || [],
        cautions: summary.cautions || '',
        pathya: summary.pathya || '',
        apathya: summary.apathya || '',
        doctor_name: summary.doctor_name || '',
        booking_number: summary.booking_number || '',
      }

      setData(transformedData)
    } catch (err) {
      console.error('Error loading discharge summary:', err)
      setError('An error occurred while loading the discharge summary.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading discharge summary...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">PDF Preview</h1>
            {bookingUuid ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-900"><strong>Error:</strong> {error}</p>
                </div>
                <p className="text-gray-600 mb-4">
                  Booking UUID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{bookingUuid}</code>
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
                  Go Back
                </button>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900">
                    <strong>Select a booking to preview a discharge summary.</strong>
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    Open this page from the Discharge Summaries list, or use the URL pattern:
                  </p>
                  <code className="block bg-blue-100 px-3 py-2 rounded text-xs mt-2">/admin/pdf-preview?booking_uuid=&lt;uuid&gt;</code>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No data to display.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Preview</h1>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'production' 
                  ? `Production Data: ${data.patient_name} (${data.patient_uhid})` 
                  : 'Development Mode: Test Data'}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Print to PDF (Ctrl+P)
            </button>
          </div>

          {/* Mode badge */}
          <div className="flex gap-2">
            {mode === 'production' && (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                PRODUCTION DATA
              </span>
            )}
            {mode === 'dev' && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                DEV: MOCK DATA
              </span>
            )}
          </div>
        </div>

        {/* Print hint */}
        {showPrintHint && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Press Ctrl+P (or Cmd+P on Mac) to generate a PDF. Verify the layout, page breaks, and content before Puppeteer automation is enabled.
            </p>
            <button
              onClick={() => setShowPrintHint(false)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Template rendering */}
        <div className="bg-white shadow">
          <div className="p-6 sm:p-8">
            <DischargeSummaryTemplate data={data} />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Once this preview looks correct, Puppeteer will generate PDFs using the same component.</p>
          {mode === 'dev' && (
            <p className="mt-2 text-gray-400">
              To preview real data: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/admin/pdf-preview?booking_uuid=&lt;uuid&gt;</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
