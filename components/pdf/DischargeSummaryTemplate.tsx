/**
 * Discharge Summary Template
 * Professional hospital discharge summary using HTML + Tailwind + Print CSS
 *
 * This component receives complete discharge summary data and renders it
 * as a hospital-quality document. It can be:
 * 1. Previewed in the browser at /admin/pdf-preview
 * 2. Printed to PDF by Puppeteer in the PDF generation API
 *
 * No manual drawing, no page calculations, no custom layout engine.
 * Just React + Tailwind + Print CSS.
 */

import { Header } from './Header'
import { PatientInfo } from './PatientInfo'
import { Section } from './Section'
import { MedicineTable } from './MedicineTable'
import { Signature } from './Signature'
import { QRCodeComponent } from './QRCode'
import { Footer } from './Footer'

export interface DischargeSummaryData {
  // Patient
  patient_uhid: string
  patient_name: string
  age: string
  sex: string
  nationality: string
  address: string

  // Dates
  doa_date: string
  doa_time: string
  dod_date: string
  dod_time: string

  // Clinical
  diagnosis: string
  complaints: string[]
  history_present_complaints: string
  history_days: string
  past_history_medical: string
  past_history_surgical: string
  past_history_details: string
  medication_administered: string
  day_of_therapy: string
  pradhan_vedna: string[]

  // Vitals
  vitals_bp: string
  vitals_hr: string
  vitals_nadi: string

  // Examination
  oe_mala: string
  oe_mutra: string
  oe_jihwa: string
  oe_shuda: string
  oe_nidra: string

  // Treatment
  therapies: string[]
  investigations: string
  findings_discharge: string
  condition_discharge: string
  advice_discharge: string
  medicine_discharge: string

  // Medicines
  medicines: Array<{
    name: string
    dosage: string
    instructions: string
    schedule: string
    duration: string
  }>

  // Lifestyle
  cautions: string
  pathya: string
  apathya: string

  // Doctor
  doctor_name: string

  // Booking
  booking_number?: string
}

interface DischargeSummaryTemplateProps {
  data: DischargeSummaryData
}

export function DischargeSummaryTemplate({ data }: DischargeSummaryTemplateProps) {
  return (
    <div className="bg-white text-gray-900 font-serif" id="discharge-summary-document">
      {/* ── Header ── */}
      <Header />

      {/* ── Main content ── */}
      <div className="px-4 sm:px-6 py-4">

        {/* Patient Info */}
        <PatientInfo
          patient_uhid={data.patient_uhid}
          patient_name={data.patient_name}
          age={data.age}
          sex={data.sex}
          nationality={data.nationality}
          address={data.address}
          doa_date={data.doa_date}
          doa_time={data.doa_time}
          dod_date={data.dod_date}
          dod_time={data.dod_time}
        />

        {/* Diagnosis */}
        {data.diagnosis && <Section title="DIAGNOSIS" content={data.diagnosis} />}

        {/* Complaints */}
        {data.complaints && data.complaints.length > 0 && (
          <Section title="COMPLAINTS ON ADMISSION" content={data.complaints.filter(Boolean)} />
        )}

        {/* History of Present Complaints */}
        {data.history_present_complaints && (
          <Section title="HISTORY OF PRESENT COMPLAINTS" content={data.history_present_complaints} />
        )}

        {/* Past History */}
        {(data.past_history_medical || data.past_history_surgical) && (
          <div className="section mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 border-b-2 border-orange-500 pb-1">
              PAST HISTORY
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Medical</p>
                <p className="text-gray-800">{data.past_history_medical || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Surgical</p>
                <p className="text-gray-800">{data.past_history_surgical || '—'}</p>
              </div>
            </div>
            {data.past_history_details && (
              <p className="text-sm text-gray-800 mt-2 leading-relaxed">
                {data.past_history_details}
              </p>
            )}
          </div>
        )}

        {/* Medication Administered */}
        {data.medication_administered && (
          <Section title="MEDICATION ADMINISTERED" content={data.medication_administered} />
        )}

        {/* Day of Therapy */}
        {data.day_of_therapy && (
          <Section title="DAY OF THERAPY" content={data.day_of_therapy} />
        )}

        {/* Pradhan Vedna */}
        {data.pradhan_vedna && data.pradhan_vedna.length > 0 && (
          <Section title="PRADHAN VEDNA (MAIN COMPLAINTS)" content={data.pradhan_vedna.filter(Boolean)} />
        )}

        {/* Vitals on Admission */}
        {(data.vitals_bp || data.vitals_hr || data.vitals_nadi) && (
          <div className="section mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 border-b-2 border-orange-500 pb-1">
              VITALS ON ADMISSION
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">BP</p>
                <p className="text-gray-800">{data.vitals_bp || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">HR</p>
                <p className="text-gray-800">{data.vitals_hr || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Nadi</p>
                <p className="text-gray-800">{data.vitals_nadi || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Examination (O/E) */}
        {(data.oe_mala || data.oe_mutra || data.oe_jihwa) && (
          <div className="section mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 border-b-2 border-orange-500 pb-1">
              EXAMINATION (O/E)
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700">Mala</p>
                <p className="text-gray-800">{data.oe_mala || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Mutra</p>
                <p className="text-gray-800">{data.oe_mutra || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Jihwa</p>
                <p className="text-gray-800">{data.oe_jihwa || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Shuda</p>
                <p className="text-gray-800">{data.oe_shuda || '—'}</p>
              </div>
            </div>
            {data.oe_nidra && (
              <div className="mt-2 pt-2 border-t">
                <p className="font-semibold text-gray-700 text-sm">Nidra</p>
                <p className="text-gray-800 text-sm">{data.oe_nidra}</p>
              </div>
            )}
          </div>
        )}

        {/* Therapies */}
        {data.therapies && data.therapies.length > 0 && (
          <Section title="THERAPIES / PROCEDURES" content={data.therapies.filter(Boolean)} />
        )}

        {/* Investigations */}
        {data.investigations && (
          <Section title="INVESTIGATIONS" content={data.investigations} />
        )}

        {/* Findings on Discharge */}
        {data.findings_discharge && (
          <Section title="FINDINGS ON DISCHARGE" content={data.findings_discharge} />
        )}

        {/* Condition at Discharge */}
        {data.condition_discharge && (
          <Section title="CONDITION AT DISCHARGE" content={data.condition_discharge} />
        )}

        {/* Advice on Discharge */}
        {data.advice_discharge && (
          <Section
            title="ADVICE ON DISCHARGE"
            content={typeof data.advice_discharge === 'string' ? data.advice_discharge : ''}
          />
        )}

        {/* Medicines Table */}
        {data.medicines && data.medicines.length > 0 && (
          <MedicineTable medicines={data.medicines} />
        )}

        {/* Cautions */}
        {data.cautions && <Section title="CAUTIONS" content={data.cautions} />}

        {/* Pathya */}
        {data.pathya && (
          <Section
            title="PATHYA (RECOMMENDED)"
            content={typeof data.pathya === 'string' ? data.pathya : ''}
          />
        )}

        {/* Apathya */}
        {data.apathya && (
          <Section
            title="APATHYA (CONTRAINDICATED)"
            content={typeof data.apathya === 'string' ? data.apathya : ''}
          />
        )}

        {/* QR Code */}
        {data.booking_number && (
          <div className="page-break-before mt-8 pt-8">
            <QRCodeComponent bookingNumber={data.booking_number} />
          </div>
        )}

        {/* Signature */}
        <Signature doctor_name={data.doctor_name} />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
