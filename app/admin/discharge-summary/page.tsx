'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function DischargeSummaryPage() {
  const router = useRouter()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [treatment, setTreatment] = useState('')
  const [recommendations, setRecommendations] = useState('')

  useEffect(() => {
    setMounted(true)
    const sp = new URLSearchParams(window.location.search)
    setBookingId(sp.get('booking_id'))
    
    if (sp.get('booking_id')) {
      loadBookingData(sp.get('booking_id')!)
    }
  }, [])

  async function loadBookingData(id: string) {
    try {
      const res = await fetch(`/api/admin/bookings?booking_id=${id}`)
      const data = await res.json()
      const bk = data.bookings?.[0]
      if (bk) {
        setBooking(bk)
        setTreatment(bk.treatments || '')
        setNotes(bk.notes || '')
      }
    } catch (error) {
      console.error('Error loading booking:', error)
    }
  }

  async function handleDownloadPDF() {
    if (!patient) {
      alert('Please fill in patient details')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discharge-summary/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patient.full_name || patient.name,
          patient_id: patient.patient_id || patient.id,
          patient_phone: patient.phone || '',
          patient_email: patient.email || '',
          doctor_name: booking?.doctor_name || booking?.doctor || 'Not Selected',
          appointment_date: booking?.preferred_date || '',
          diagnosis,
          treatment,
          recommendations,
          notes,
          booking_id: booking?.booking_id || '',
        }),
      })
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `discharge-${patient.patient_id || 'summary'}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to download PDF')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href={bookingId ? `/admin/appointments` : `/admin`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-8" style={{ color: '#F97316' }}>
            Discharge Summary
          </h1>

          <div className="space-y-6">
            {/* Patient Section */}
            {!bookingId && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={patient?.full_name || patient?.name || ''}
                    onChange={(e) => setPatient({ ...patient, full_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Patient ID"
                    value={patient?.patient_id || patient?.id || ''}
                    onChange={(e) => setPatient({ ...patient, patient_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={patient?.email || ''}
                    onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={patient?.phone || ''}
                    onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {bookingId && booking && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pre-filled from Appointment</h2>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <p><strong>Patient:</strong> {booking.patient_name}</p>
                  <p><strong>Patient ID:</strong> {booking.patient_id}</p>
                  <p><strong>Booking ID:</strong> {booking.booking_id}</p>
                  <p><strong>Doctor:</strong> {booking.doctor_name || booking.doctor || 'Not Selected'}</p>
                  <p><strong>Appointment Date:</strong> {booking.preferred_date}</p>
                  <p><strong>Treatment:</strong> {booking.treatments}</p>
                </div>
              </div>
            )}

            {/* Clinical Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Clinical Information</h2>
              <div className="space-y-4">
                <textarea
                  placeholder="Diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Treatment Provided"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Recommendations"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="Additional Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Download Button */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleDownloadPDF}
                disabled={loading || (!bookingId && !patient)}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
