'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function DischargeSummaryPage() {
  const router = useRouter()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [doctors, setDoctors] = useState<any[]>([])
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
    clinic_email: 'ayurshalapanchkarma@gmail.com',
  })

  useEffect(() => {
    setMounted(true)
    loadDoctors()
    const bookId = new URLSearchParams(window.location.search).get('booking_id')
    if (bookId) {
      setBookingId(bookId)
      loadBookingData(bookId)
    }
  }, [])

  async function loadDoctors() {
    try {
      const res = await fetch('/api/admin/doctors')
      const data = await res.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  async function loadBookingData(id: string) {
    try {
      const res = await fetch(`/api/admin/bookings?booking_id=${id}`)
      const data = await res.json()
      const booking = data.bookings?.[0]
      if (booking) {
        const appointmentDate = new Date(booking.preferred_date)
        setForm(prev => ({
          ...prev,
          patient_uhid: booking.patient_id || '',
          patient_name: booking.patient_name || '',
          doa_date: appointmentDate.toISOString().split('T')[0],
          dod_date: appointmentDate.toISOString().split('T')[0],
          doa_time: booking.preferred_time || '',
          doctor_name: booking.doctor_name || booking.doctor || '',
          diagnosis: booking.treatments || '',
        }))
      }
    } catch (error) {
      console.error('Error loading booking:', error)
    }
  }

  function updateFormField(field: string, value: any) {
    setForm(prev => {
      const updated = { ...prev }
      ;(updated as any)[field] = value
      return updated
    })
  }

  function updateComplaint(index: number, value: string) {
    const updated = [...form.complaints]
    updated[index] = value
    updateFormField('complaints', updated)
  }

  function updatePradhanVedna(index: number, value: string) {
    const updated = [...form.pradhan_vedna]
    updated[index] = value
    updateFormField('pradhan_vedna', updated)
  }

  function updateTherapy(index: number, value: string) {
    const updated = [...form.therapies]
    updated[index] = value
    updateFormField('therapies', updated)
  }

  function addTherapy() {
    updateFormField('therapies', [...form.therapies, ''])
  }

  function removeTherapy(index: number) {
    updateFormField('therapies', form.therapies.filter((_, i) => i !== index))
  }

  function updateMedicine(index: number, field: string, value: string) {
    const updated = [...form.medicines]
    updated[index] = { ...updated[index], [field]: value }
    updateFormField('medicines', updated)
  }

  function addMedicine() {
    updateFormField('medicines', [...form.medicines, { name: '', dosage: '', instructions: '', schedule: '', duration: '' }])
  }

  function removeMedicine(index: number) {
    updateFormField('medicines', form.medicines.filter((_, i) => i !== index))
  }

  function handleDoctorChange(e: any) {
    const doctorName = e.target.value
    updateFormField('doctor_name', doctorName)
    const doctor = doctors.find(d => d.name === doctorName)
    if (doctor) {
      updateFormField('doctor_mobile', doctor.mobile || '')
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <Link href="/admin/appointments" className="inline-flex items-center gap-2 text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="p-8 border-b">
          <h1 className="text-3xl font-bold" style={{ color: '#F97316' }}>Discharge Summary - Day Care</h1>
        </div>

        <form className="p-8 space-y-8">
          {/* SECTION 2: Patient Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Patient UHID" value={form.patient_uhid} onChange={(e) => updateFormField('patient_uhid', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="text" placeholder="Patient Name" value={form.patient_name} onChange={(e) => updateFormField('patient_name', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="text" placeholder="Age" value={form.age} onChange={(e) => updateFormField('age', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input type="date" placeholder="DOA" value={form.doa_date} onChange={(e) => updateFormField('doa_date', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="time" placeholder="DOA Time" value={form.doa_time} onChange={(e) => updateFormField('doa_time', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="date" placeholder="DOD" value={form.dod_date} onChange={(e) => updateFormField('dod_date', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="time" placeholder="DOD Time" value={form.dod_time} onChange={(e) => updateFormField('dod_time', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.sex} onChange={(e) => updateFormField('sex', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800">
                <option value="">Select Sex</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <input type="text" placeholder="Nationality" value={form.nationality} onChange={(e) => updateFormField('nationality', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
            </div>
            <textarea placeholder="Address" value={form.address} onChange={(e) => updateFormField('address', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 3: Diagnosis */}
          <div>
            <label className="font-semibold block mb-2">Diagnosis</label>
            <textarea value={form.diagnosis} onChange={(e) => updateFormField('diagnosis', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={3} />
          </div>

          {/* SECTION 4: Complaints */}
          <div>
            <label className="font-semibold block mb-2">Complaints on Admission</label>
            <div className="space-y-2">
              {form.complaints.map((complaint, idx) => (
                <textarea key={idx} value={complaint} onChange={(e) => updateComplaint(idx, e.target.value)} placeholder={`${idx + 1}. Complaint`} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={1} />
              ))}
            </div>
          </div>

          {/* SECTION 5: History */}
          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-2">History of Present Complaints</label>
              <div className="flex gap-4 items-end">
                <textarea value={form.history_present_complaints} onChange={(e) => updateFormField('history_present_complaints', e.target.value)} className="flex-1 border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Days" value={form.history_days} onChange={(e) => updateFormField('history_days', e.target.value)} className="w-20 border rounded px-3 py-2 dark:bg-gray-800" />
                  <span>Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Past History */}
          <div className="space-y-4">
            <label className="font-semibold block">Past History</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Medical</label>
                <div className="flex gap-4">
                  {['Yes', 'No'].map(option => (
                    <label key={option} className="flex items-center gap-2">
                      <input type="radio" name="past_history_medical" value={option} checked={form.past_history_medical === option} onChange={(e) => updateFormField('past_history_medical', e.target.value)} />
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
                      <input type="radio" name="past_history_surgical" value={option} checked={form.past_history_surgical === option} onChange={(e) => updateFormField('past_history_surgical', e.target.value)} />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <textarea placeholder="If Yes, provide details" value={form.past_history_details} onChange={(e) => updateFormField('past_history_details', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 7: Medication Administered */}
          <div>
            <label className="font-semibold block mb-2">Medication Administered</label>
            <textarea value={form.medication_administered} onChange={(e) => updateFormField('medication_administered', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 8: Day of Therapy */}
          <div>
            <label className="font-semibold block mb-2">Day of Therapy</label>
            <input type="text" value={form.day_of_therapy} onChange={(e) => updateFormField('day_of_therapy', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800 w-32" />
          </div>

          {/* SECTION 9: Pradhan Vedna */}
          <div>
            <label className="font-semibold block mb-2">Pradhan Vedna</label>
            <div className="space-y-2">
              {form.pradhan_vedna.map((vedna, idx) => (
                <textarea key={idx} value={vedna} onChange={(e) => updatePradhanVedna(idx, e.target.value)} placeholder={`${idx + 1}. Pradhan Vedna`} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={1} />
              ))}
            </div>
          </div>

          {/* SECTION 10: Vitals */}
          <div>
            <label className="font-semibold block mb-2">Vitals on Admission</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="BP (e.g., 120/80)" value={form.vitals_bp} onChange={(e) => updateFormField('vitals_bp', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="text" placeholder="HR (e.g., 72)" value={form.vitals_hr} onChange={(e) => updateFormField('vitals_hr', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
              <input type="text" placeholder="Nadi (e.g., V3, P2, K1)" value={form.vitals_nadi} onChange={(e) => updateFormField('vitals_nadi', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800" />
            </div>
          </div>

          {/* SECTION 11: O/E */}
          <div>
            <label className="font-semibold block mb-2">O/E (Examination)</label>
            <div className="space-y-3">
              {['Mala', 'Mutra', 'Jihwa', 'Shuda', 'Nidra'].map(field => {
                const key = `oe_${field.toLowerCase()}` as keyof typeof form
                return (
                  <div key={field} className="flex items-center gap-4">
                    <label className="w-20">{field}</label>
                    <select value={form[key] as string} onChange={(e) => updateFormField(key, e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800">
                      <option value="Samyak">Samyak</option>
                      <option value="Asamyak">Asamyak</option>
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SECTION 12: Therapy */}
          <div>
            <label className="font-semibold block mb-2">Therapy / Procedures</label>
            <div className="space-y-2">
              {form.therapies.map((therapy, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={therapy} onChange={(e) => updateTherapy(idx, e.target.value)} placeholder={`${idx + 1}. Therapy`} className="flex-1 border rounded px-3 py-2 dark:bg-gray-800" />
                  {form.therapies.length > 3 && (
                    <button type="button" onClick={() => removeTherapy(idx)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addTherapy} className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              <Plus className="w-4 h-4" /> Add Therapy
            </button>
          </div>

          {/* SECTION 13: Investigations */}
          <div>
            <label className="font-semibold block mb-2">Investigations</label>
            <textarea value={form.investigations} onChange={(e) => updateFormField('investigations', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 14: Findings on Discharge */}
          <div>
            <label className="font-semibold block mb-2">Findings on Discharge</label>
            <textarea value={form.findings_discharge} onChange={(e) => updateFormField('findings_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 15: Condition at Discharge */}
          <div>
            <label className="font-semibold block mb-2">Condition at Time of Discharge</label>
            <textarea value={form.condition_discharge} onChange={(e) => updateFormField('condition_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 16: Advice on Discharge */}
          <div>
            <label className="font-semibold block mb-2">Advice on Discharge</label>
            <textarea value={form.advice_discharge} onChange={(e) => updateFormField('advice_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 17: Medicine on Discharge */}
          <div>
            <label className="font-semibold block mb-2">Medicine on Discharge</label>
            <textarea value={form.medicine_discharge} onChange={(e) => updateFormField('medicine_discharge', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 17B: Medication Table */}
          <div>
            <label className="font-semibold block mb-2">Medication Table</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Medication Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Dosage</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Instructions</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Schedule</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Duration</th>
                    <th className="border border-gray-300 px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.medicines.map((medicine, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.instructions} onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.schedule} onChange={(e) => updateMedicine(idx, 'schedule', e.target.value)} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      <td className="border border-gray-300 px-3 py-2"><input type="text" value={medicine.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} className="w-full border rounded px-2 py-1 dark:bg-gray-800" /></td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{form.medicines.length > 1 && <button type="button" onClick={() => removeMedicine(idx)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addMedicine} className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              <Plus className="w-4 h-4" /> Add Medicine
            </button>
          </div>

          {/* SECTION 18: Cautions */}
          <div>
            <label className="font-semibold block mb-2">Cautions</label>
            <textarea value={form.cautions} onChange={(e) => updateFormField('cautions', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 19: Pathya */}
          <div>
            <label className="font-semibold block mb-2">Pathya</label>
            <textarea value={form.pathya} onChange={(e) => updateFormField('pathya', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 20: Apathya */}
          <div>
            <label className="font-semibold block mb-2">Apathya</label>
            <textarea value={form.apathya} onChange={(e) => updateFormField('apathya', e.target.value)} className="w-full border rounded px-3 py-2 dark:bg-gray-800" rows={2} />
          </div>

          {/* SECTION 21-24: Doctor & Contact */}
          <div className="space-y-4">
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
              <input type="text" value={form.doctor_mobile} onChange={(e) => updateFormField('doctor_mobile', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800 w-full" />
            </div>
            <div>
              <label className="font-semibold block mb-2">Clinic Email</label>
              <input type="email" value={form.clinic_email} onChange={(e) => updateFormField('clinic_email', e.target.value)} className="border rounded px-3 py-2 dark:bg-gray-800 w-full" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6 border-t">
            <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Draft</button>
            <button type="button" className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}
