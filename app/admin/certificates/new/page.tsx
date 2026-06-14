'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Home, Save, Send, X, Eye, Loader } from 'lucide-react'
import { useTheme } from 'next-themes'

type Patient = {
  id: string
  full_name: string
  patient_id: string
  email: string
  phone: string
}

type Booking = {
  booking_uuid: string
  booking_id: string
  preferred_date: string
  booking_type: string
  status: string
}

type CertificateType = {
  id: string
  name: string
}

type FormData = {
  patient_uuid: string
  booking_uuid?: string
  certificate_type_id: string
  issue_date: string
  issued_by: string
  valid_from?: string
  valid_to?: string
  purpose?: string
  diagnosis?: string
  treatment_details?: string
  recommendations?: string
  restrictions?: string
  additional_notes?: string
}

export default function NewCertificatePage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searchPatient, setSearchPatient] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    patient_uuid: '',
    certificate_type_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    issued_by: '',
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.patient_uuid) {
      loadBookings(formData.patient_uuid)
    } else {
      setBookings([])
    }
  }, [formData.patient_uuid])

  async function loadData() {
    const [patientsRes, typesRes] = await Promise.all([
      supabase.from('patients').select('id, patient_id, full_name, email, phone').eq('is_deleted', false).order('full_name'),
      supabase.from('certificate_types').select('id, name').order('name'),
    ])

    if (patientsRes.data) {
      setPatients(patientsRes.data)
    }

    if (typesRes.data) setCertificateTypes(typesRes.data)
  }

  async function loadBookings(patientUuid: string) {
    const { data } = await supabase
      .from('bookings_new')
      .select('booking_uuid, booking_id, preferred_date, booking_type, status')
      .eq('patient_uuid', patientUuid)
      .eq('status', 'COMPLETED')
      .order('preferred_date', { ascending: false })

    if (data) setBookings(data)
  }

  function handlePatientSelect(patient: Patient) {
    setSelectedPatient(patient)
    setFormData({ ...formData, patient_uuid: patient.id })
    setShowPatientDropdown(false)
    setSearchPatient('')
  }

  const filteredPatients = searchPatient
    ? patients.filter(p =>
        p.full_name.toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(searchPatient.toLowerCase())
      )
    : patients

  async function saveDraft() {
    if (!formData.patient_uuid || !formData.certificate_type_id) {
      alert('Please select patient and certificate type')
      return
    }

    setLoading(true)
    const cert_no = `AYC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`

    const { error } = await supabase.from('certificates').insert([{
      certificate_no: cert_no,
      patient_uuid: formData.patient_uuid,
      booking_uuid: formData.booking_uuid || null,
      certificate_type_id: formData.certificate_type_id,
      issue_date: formData.issue_date,
      issued_by: formData.issued_by,
      valid_from: formData.valid_from || null,
      valid_to: formData.valid_to || null,
      purpose: formData.purpose || null,
      diagnosis: formData.diagnosis || null,
      treatment_details: formData.treatment_details || null,
      recommendations: formData.recommendations || null,
      restrictions: formData.restrictions || null,
      additional_notes: formData.additional_notes || null,
      status: 'DRAFT',
    }])

    setLoading(false)
    if (!error) {
      router.push('/admin/certificates')
    } else {
      alert(`Error saving certificate: ${error?.message}`)
    }
  }

  async function issueCertificate() {
    if (!formData.patient_uuid || !formData.certificate_type_id) {
      alert('Please select patient and certificate type')
      return
    }

    setLoading(true)
    const cert_no = `AYC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`

    const payload = {
      certificate_no: cert_no,
      patient_uuid: formData.patient_uuid,
      booking_uuid: formData.booking_uuid || null,
      certificate_type_id: formData.certificate_type_id,
      issue_date: formData.issue_date,
      issued_by: formData.issued_by,
      valid_from: formData.valid_from || null,
      valid_to: formData.valid_to || null,
      purpose: formData.purpose || null,
      diagnosis: formData.diagnosis || null,
      treatment_details: formData.treatment_details || null,
      recommendations: formData.recommendations || null,
      restrictions: formData.restrictions || null,
      additional_notes: formData.additional_notes || null,
      status: 'ISSUED',
    }

    const { error } = await supabase.from('certificates').insert([payload]).select()

    if (error) {
      console.error('Error issuing certificate:', error)
      setLoading(false)
      alert(`Error issuing certificate: ${error.message}`)
      return
    }

    setLoading(false)
    router.push('/admin/certificates')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-serif mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>Issue Certificate</h1>
            <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>Create and issue a new patient certificate</p>
          </div>
          <Link href="/admin/certificates"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              isDark
                ? 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700'
                : 'bg-white/50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}>
            <Home className="w-5 h-5" />
            Back
          </Link>
        </div>

        <div className={`rounded-2xl backdrop-blur-2xl border p-8 ${
          isDark
            ? 'bg-slate-900/60 border-slate-700/50'
            : 'bg-white/70 border-white/40'
        }`}>
          <div className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Patient *
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                  className={`px-4 py-2 rounded-lg border cursor-pointer transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}>
                  {selectedPatient ? `${selectedPatient.full_name} (${selectedPatient.patient_id})` : 'Select Patient'}
                </div>

                {showPatientDropdown && (
                  <div className={`absolute top-full mt-2 w-full z-50 rounded-lg border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-stone-200'
                  }`}>
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className={`w-full px-4 py-2 border-b rounded-t-lg ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-gray-200'
                          : 'bg-white border-stone-200 text-stone-900'
                      }`}
                      autoFocus
                    />
                    <div className="max-h-60 overflow-y-auto">
                      {filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handlePatientSelect(p)}
                          className={`px-4 py-2 cursor-pointer transition ${
                            isDark
                              ? 'hover:bg-slate-700 text-gray-200'
                              : 'hover:bg-stone-100 text-stone-900'
                          }`}>
                          {p.full_name} ({p.patient_id})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white/50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>
                    <strong>ID:</strong> {selectedPatient.patient_id}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>
                    <strong>Email:</strong> {selectedPatient.email}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-stone-600'}`}>
                    <strong>Phone:</strong> {selectedPatient.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Related Booking */}
            {bookings.length > 0 && (
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Related Booking (Optional)
                </label>
                <select
                  value={formData.booking_uuid || ''}
                  onChange={(e) => setFormData({ ...formData, booking_uuid: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}>
                  <option value="">Select a booking</option>
                  {bookings.map((b) => (
                    <option key={b.booking_uuid} value={b.booking_uuid}>
                      {b.booking_id} - {b.booking_type} ({new Date(b.preferred_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Certificate Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Certificate Type *
                </label>
                <select
                  value={formData.certificate_type_id}
                  onChange={(e) => setFormData({ ...formData, certificate_type_id: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}>
                  <option value="">Select type</option>
                  {certificateTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Issue Date *
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              <div className="col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Issued By *
                </label>
                <input
                  type="text"
                  placeholder="Doctor/Physician Name"
                  value={formData.issued_by}
                  onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                  required
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.valid_from || ''}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                  Valid To
                </label>
                <input
                  type="date"
                  value={formData.valid_to || ''}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                      : 'bg-white/50 border-stone-200 text-stone-900'
                  }`}
                />
              </div>
            </div>

            {/* Purpose & Medical Details */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Purpose
              </label>
              <textarea
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Purpose of certificate..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Diagnosis
              </label>
              <textarea
                value={formData.diagnosis || ''}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Patient diagnosis..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Treatment Details
              </label>
              <textarea
                value={formData.treatment_details || ''}
                onChange={(e) => setFormData({ ...formData, treatment_details: e.target.value })}
                placeholder="Treatments provided..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Recommendations
              </label>
              <textarea
                value={formData.recommendations || ''}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                placeholder="Recommendations for patient..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Restrictions
              </label>
              <textarea
                value={formData.restrictions || ''}
                onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                placeholder="Activity restrictions or limitations..."
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                Additional Notes
              </label>
              <textarea
                value={formData.additional_notes || ''}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
                className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                    : 'bg-white/50 border-stone-200 text-stone-900'
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={saveDraft}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 transition">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Draft
              </button>

              <button
                onClick={issueCertificate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 transition">
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Issue Certificate
              </button>

              <Link href="/admin/certificates"
                className="flex items-center gap-2 px-6 py-3 rounded-lg border bg-transparent text-gray-600 dark:text-gray-300 font-semibold hover:bg-stone-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
