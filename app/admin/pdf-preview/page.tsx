'use client'
import { useState } from 'react'
import { DischargeSummaryTemplate, type DischargeSummaryData } from '@/components/pdf/DischargeSummaryTemplate'
import '@/styles/pdf.css'

/**
 * PDF Preview Page
 * 
 * This page renders the discharge summary template in the browser.
 * Use it to verify layout, spacing, tables, and page breaks BEFORE
 * integrating Puppeteer.
 * 
 * To test:
 * 1. Open /admin/pdf-preview
 * 2. Review the layout — should look like a professional hospital document
 * 3. Test print: Ctrl+P / Cmd+P → Print to PDF
 * 4. Verify page breaks, tables, signatures look correct
 * 5. Once satisfied, Puppeteer will generate the same PDF automatically
 */

// Sample test data — change this to test different scenarios
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

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="mb-4 bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Preview</h1>
            <p className="text-sm text-gray-600 mt-1">
              This is how the discharge summary will appear in the PDF
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Print to PDF (Ctrl+P)
          </button>
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
            <DischargeSummaryTemplate data={testData} />
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Once this preview looks correct, Puppeteer will generate PDFs using the same component.</p>
        </div>
      </div>
    </div>
  )
}
