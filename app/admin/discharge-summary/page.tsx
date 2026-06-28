'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DischargeSummaryHeader } from '@/components/DischargeSummaryHeader'

export default function DischargeSummaryPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState('')
  const DOCTOR_MOBILE = '+91-9821224767'
  const CLINIC_EMAIL = 'ayurshalapanchkarma@gmail.com'
  const doctors = [
    { id: 1, name: 'Dr. Farha Naqvi', mobile: DOCTOR_MOBILE },
    { id: 2, name: 'Dr. Sanjay Yadav', mobile: DOCTOR_MOBILE }
  ]
  const [form, setForm] = useState({
    patient_uhid: '',
    patient_name: '',
    age: '',
    sex: '',
    doa_date: '',
    doa_time: '',
    dod_date: '',
    dod_time: '',
    nationality: 'Indian',
    address: '',
    diagnosis: '',
    complaints: ['', '', '', '', ''],
    history_present_complaints: '',
    history_days: '',
    past_history_medical: 'No',
    past_history_surgical: 'No',
    past_history_details: '',
    medication_administered: '',
    day_of_therapy: '',
    pradhan_vedna: ['', '', ''],
    vitals_bp: '',
    vitals_hr: '',
    vitals_nadi: '',
    oe_mala: 'Samyak',
    oe_mutra: 'Samyak',
    oe_jihwa: 'Samyak',
    oe_shuda: 'Samyak',
    oe_nidra: 'Samyak',
    therapies: ['', '', ''],
    investigations: '',
    findings_discharge: '',
    condition_discharge: '',
    advice_discharge: '',
    medicine_discharge: '',
    medicines: [{ name: '', dosage: '', instructions: '', schedule: '', duration: '' }],
    cautions: '',
    pathya: '',
    apathya: '',
    doctor_name: '',
    doctor_mobile: '',
  })

  useEffect(() => {
    setMounted(true)
    const bookId = new URLSearchParams(window.location.search).get('booking_id')
    if (bookId) {
      setBookingId(bookId)
      loadBookingData(bookId)
    } else {
      const now = new Date()
      setForm(prev => ({
        ...prev,
        dod_date: now.toISOString().split('T')[0],
        dod_time: now.toTimeString().slice(0, 5),
      }))
    }
  }, [])

  async function loadBookingData(id: string) {
    try {
      const res = await fetch(`/api/admin/bookings?booking_id=${id}`)
      const data = await res.json()
      const booking = data.bookings?.[0]
      if (booking) {
        const appointmentDate = new Date(booking.preferred_date)
        const now = new Date()
        setForm(prev => ({
          ...prev,
          patient_uhid: booking.patient_id || '',
          patient_name: booking.patient_name || '',
          doa_date: appointmentDate.toISOString().split('T')[0],
          doa_time: booking.preferred_time || '',
          dod_date: now.toISOString().split('T')[0],
          dod_time: now.toTimeString().slice(0, 5),
          doctor_name: booking.doctor_name || booking.doctor || '',
          doctor_mobile: DOCTOR_MOBILE,
          diagnosis: booking.treatments || '',
        }))
      }
    } catch (error) {
      console.error('Error loading booking:', error)
    }
  }

  function validateDates() {
    if (!form.doa_date || !form.dod_date) return true
    const doaDate = new Date(form.doa_date)
    const dodDate = new Date(form.dod_date)
    if (dodDate < doaDate) {
      setValidationError('DOD cannot be earlier than DOA')
      return false
    }
    if (form.doa_date === form.dod_date && form.doa_time && form.dod_time) {
      if (form.dod_time < form.doa_time) {
        setValidationError('DOD time cannot be earlier than DOA time on the same day')
        return false
      }
    }
    setValidationError('')
    return true
  }

  function updateForm(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value } as any))
    validateDates()
  }

  function handleDoctorChange(e: any) {
    const doctorName = e.target.value
    updateForm('doctor_name', doctorName)
    updateForm('doctor_mobile', DOCTOR_MOBILE)
  }

  async function downloadPDF() {
    if (!validateDates()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discharge-summary-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Discharge_Summary_${form.patient_uhid || 'PATIENT'}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DischargeSummaryHeader onDownloadPDF={downloadPDF} isLoading={loading} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/admin/appointments" className="inline-flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </Link>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="p-8 border-b">
            <h2 className="text-2xl font-semibold">Patient Discharge Information</h2>
          </div>
          <form className="p-8 space-y-8">
            {validationError && <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">{validationError}</div>}

            {/* Patient Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Patient UHID" value={form.patient_uhid} onChange={(e) => updateForm('patient_uhid', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
                <input type="text" placeholder="Patient Name" value={form.patient_name} onChange={(e) => updateForm('patient_name', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
                <input type="text" placeholder="Age" value={form.age} onChange={(e) => updateForm('age', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={form.sex} onChange={(e) => updateForm('sex', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800">
                  <option value="">Select Sex</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <input type="text" placeholder="Nationality" value={form.nationality} onChange={(e) => updateForm('nationality', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              </div>
              <textarea placeholder="Address" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Day Care Section */}
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-semibold">Day Care</h3>

              {/* DOA */}
              <div className="space-y-3">
                <label className="font-semibold block">DOA (Date of Admission)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Date</label>
                    <input type="date" value={form.doa_date} onChange={(e) => updateForm('doa_date', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Time</label>
                    <input type="time" value={form.doa_time} onChange={(e) => updateForm('doa_time', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" />
                  </div>
                </div>
              </div>

              {/* DOD */}
              <div className="space-y-3">
                <label className="font-semibold block">DOD (Date of Discharge)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Date</label>
                    <input type="date" value={form.dod_date} onChange={(e) => updateForm('dod_date', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Time</label>
                    <input type="time" value={form.dod_time} onChange={(e) => updateForm('dod_time', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="font-semibold block mb-2">Diagnosis</label>
              <textarea value={form.diagnosis} onChange={(e) => updateForm('diagnosis', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={3} />
            </div>

            {/* Complaints */}
            <div>
              <label className="font-semibold block mb-2">Complaints on Admission</label>
              <div className="space-y-2">
                {form.complaints.map((_, idx) => (
                  <textarea key={idx} value={form.complaints[idx]} onChange={(e) => { const updated = [...form.complaints]; updated[idx] = e.target.value; updateForm('complaints', updated) }} placeholder={`${idx + 1}. Complaint`} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={1} />
                ))}
              </div>
            </div>

            {/* History */}
            <div>
              <label className="font-semibold block mb-2">History of Present Complaints</label>
              <div className="flex gap-4 items-end">
                <textarea value={form.history_present_complaints} onChange={(e) => updateForm('history_present_complaints', e.target.value)} className="flex-1 border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Days" value={form.history_days} onChange={(e) => updateForm('history_days', e.target.value)} className="w-20 border rounded px-3 py-2 dark:bg-gray-800" />
                  <span>Days</span>
                </div>
              </div>
            </div>

            {/* Past History */}
            <div className="space-y-4">
              <label className="font-semibold block">Past History</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Medical</label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input type="radio" name="past_history_medical" value={option} checked={form.past_history_medical === option} onChange={(e) => updateForm('past_history_medical', e.target.value)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2">Surgical</label>
                  <div className="flex gap-4">
                    {['Yes', 'No'].map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input type="radio" name="past_history_surgical" value={option} checked={form.past_history_surgical === option} onChange={(e) => updateForm('past_history_surgical', e.target.value)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <textarea placeholder="If Yes, provide details" value={form.past_history_details} onChange={(e) => updateForm('past_history_details', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Medication Administered */}
            <div>
              <label className="font-semibold block mb-2">Medication Administered</label>
              <textarea value={form.medication_administered} onChange={(e) => updateForm('medication_administered', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Day of Therapy */}
            <div>
              <label className="font-semibold block mb-2">Day of Therapy</label>
              <input type="text" value={form.day_of_therapy} onChange={(e) => updateForm('day_of_therapy', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800 w-32" />
            </div>

            {/* Pradhan Vedna */}
            <div>
              <label className="font-semibold block mb-2">Pradhan Vedna</label>
              <div className="space-y-2">
                {form.pradhan_vedna.map((_, idx) => (
                  <textarea key={idx} value={form.pradhan_vedna[idx]} onChange={(e) => { const updated = [...form.pradhan_vedna]; updated[idx] = e.target.value; updateForm('pradhan_vedna', updated) }} placeholder={`${idx + 1}. Pradhan Vedna`} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={1} />
                ))}
              </div>
            </div>

            {/* Vitals */}
            <div>
              <label className="font-semibold block mb-2">Vitals on Admission</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="BP (e.g., 120/80)" value={form.vitals_bp} onChange={(e) => updateForm('vitals_bp', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
                <input type="text" placeholder="HR (e.g., 72)" value={form.vitals_hr} onChange={(e) => updateForm('vitals_hr', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
                <input type="text" placeholder="Nadi (e.g., V3, P2, K1)" value={form.vitals_nadi} onChange={(e) => updateForm('vitals_nadi', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              </div>
            </div>

            {/* O/E */}
            <div>
              <label className="font-semibold block mb-2">O/E (Examination)</label>
              <div className="space-y-3">
                {['Mala', 'Mutra', 'Jihwa', 'Shuda', 'Nidra'].map(field => {
                  const key = `oe_${field.toLowerCase()}` as keyof typeof form
                  return (
                    <div key={field} className="flex items-center gap-4">
                      <label className="w-20">{field}</label>
                      <select value={form[key] as string} onChange={(e) => updateForm(key, e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800">
                        <option value="Samyak">Samyak</option>
                        <option value="Asamyak">Asamyak</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Therapy */}
            <div>
              <label className="font-semibold block mb-2">Therapy / Procedures</label>
              <div className="space-y-2">
                {form.therapies.map((_, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={form.therapies[idx]} onChange={(e) => { const updated = [...form.therapies]; updated[idx] = e.target.value; updateForm('therapies', updated) }} placeholder={`${idx + 1}. Therapy`} className="flex-1 border rounded px-3 py-2 dark:bg-gray-800" />
                    {form.therapies.length > 3 && (
                      <button type="button" onClick={() => { updateForm('therapies', form.therapies.filter((_, i) => i !== idx)) }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => updateForm('therapies', [...form.therapies, ''])} className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                <Plus className="w-4 h-4" /> Add Therapy
              </button>
            </div>

            {/* Investigations */}
            <div>
              <label className="font-semibold block mb-2">Investigations</label>
              <textarea value={form.investigations} onChange={(e) => updateForm('investigations', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Findings on Discharge */}
            <div>
              <label className="font-semibold block mb-2">Findings on Discharge</label>
              <textarea value={form.findings_discharge} onChange={(e) => updateForm('findings_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Condition at Discharge */}
            <div>
              <label className="font-semibold block mb-2">Condition at Time of Discharge</label>
              <textarea value={form.condition_discharge} onChange={(e) => updateForm('condition_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Advice on Discharge */}
            <div>
              <label className="font-semibold block mb-2">Advice on Discharge</label>
              <textarea value={form.advice_discharge} onChange={(e) => updateForm('advice_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Medicine on Discharge */}
            <div>
              <label className="font-semibold block mb-2">Medicine on Discharge</label>
              <textarea value={form.medicine_discharge} onChange={(e) => updateForm('medicine_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Medication Table */}
            <div>
              <label className="font-semibold block mb-2">Medication Table</label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Medication Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Dosage</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Instructions</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Schedule Time</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.medicines.map((medicine, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.name} onChange={(e) => { const updated = [...form.medicines]; updated[idx].name = e.target.value; updateForm('medicines', updated) }} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                        <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.dosage} onChange={(e) => { const updated = [...form.medicines]; updated[idx].dosage = e.target.value; updateForm('medicines', updated) }} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                        <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.instructions} onChange={(e) => { const updated = [...form.medicines]; updated[idx].instructions = e.target.value; updateForm('medicines', updated) }} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                        <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.schedule} onChange={(e) => { const updated = [...form.medicines]; updated[idx].schedule = e.target.value; updateForm('medicines', updated) }} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                        <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.duration} onChange={(e) => { const updated = [...form.medicines]; updated[idx].duration = e.target.value; updateForm('medicines', updated) }} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => updateForm('medicines', [...form.medicines, { name: '', dosage: '', instructions: '', schedule: '', duration: '' }])} className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            {/* Cautions */}
            <div>
              <label className="font-semibold block mb-2">Cautions</label>
              <textarea value={form.cautions} onChange={(e) => updateForm('cautions', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Pathya */}
            <div>
              <label className="font-semibold block mb-2">Pathya</label>
              <textarea value={form.pathya} onChange={(e) => updateForm('pathya', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Apathya */}
            <div>
              <label className="font-semibold block mb-2">Apathya</label>
              <textarea value={form.apathya} onChange={(e) => updateForm('apathya', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
            </div>

            {/* Doctor & Contact */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Doctor & Contact Information</h3>
              <div>
                <label className="font-semibold block mb-2">Doctor</label>
                <select value={form.doctor_name} onChange={handleDoctorChange} className="w-full border rounded px-3 py-2 dark:bg-gray-800">
                  <option value="">Select Doctor</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.name}>{doc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-2">Doctor Mobile</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  {form.doctor_mobile || 'No mobile number on file'}
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-2">Email</label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  ayurshalapanchkarma@gmail.com
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
