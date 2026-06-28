'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader } from 'lucide-react'
import Link from 'next/link'

export default function DischargeSummaryPage() {
  const router = useRouter()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    const bookId = new URLSearchParams(window.location.search).get('booking_id')
    if (bookId) {
      setBookingId(bookId)
      loadBookingData(bookId)
    }
  }, [])

  async function loadBookingData(id: string) {
    try {
      const res = await fetch(`/api/admin/bookings?booking_id=${id}`)
      const data = await res.json()
      setBooking(data.bookings?.[0] || null)
    } catch (error) {
      console.error('Error loading booking:', error)
    }
  }

  async function downloadPDF() {
    if (!booking) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/discharge-summary-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_uhid: booking.patient_id || '',
          patient_name: booking.patient_name || '',
          age: '45',
          sex: 'M',
          doa_date: new Date(booking.preferred_date).toLocaleDateString('en-IN'),
          doa_time: '2:00 PM',
          dod_date: new Date(booking.preferred_date).toLocaleDateString('en-IN'),
          dod_time: '2:50 PM',
          nationality: 'Indian',
          address: '',
          diagnosis: '',
          complaints: [],
          history_present: '',
          past_history: 'No',
          medications_administered: [],
          day_of_therapy: '1',
          pradhan_vedna: [],
          vitals_admission: 'BP- 110/60 mmHg, HR-88/min',
          oe_mala: 'Samyak',
          oe_mutra: 'Samyak',
          oe_jihwa: 'Samyak',
          oe_shuda: 'Samyak',
          oe_nidra: 'Samyak',
          therapies: [],
          investigations: '',
          findings_discharge: 'BP- 118/68 mmHg, Pulse- 72/Min',
          condition_discharge: 'Tolerated treatments moderately well',
          advice_discharge: 'Continue medicines with prescribed diet',
          medicine_discharge: 'As prescribed',
          medications_table: [],
          cautions: '',
          pathya: '',
          apathya: '',
          doctor_name: booking.doctor_name || booking.doctor || '',
          doctor_phone: '9821224767',
          clinic_email: 'ayurshalapanchkarma@gmail.com',
        }),
      })

      if (!res.ok) throw new Error('PDF generation failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `discharge-${booking.patient_id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (!bookingId && !isFormVisible) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#F97316' }}>Discharge Summary</h1>
          <div className="space-y-4">
            <button
              onClick={() => setIsFormVisible(true)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Summary
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isFormVisible && !bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        <Link href="#" onClick={() => setIsFormVisible(false)} className="inline-flex items-center gap-2 text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-6" style={{ color: '#F97316' }}>Create New Discharge Summary</h1>
          <p className="text-gray-600">Search for existing patient or create new patient workflow coming soon.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <Link href="/admin/appointments" className="inline-flex items-center gap-2 text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#F97316' }}>Discharge Summary</h1>

        {booking && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h2 className="font-semibold mb-3">Appointment Details</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Patient:</strong> {booking.patient_name}</p>
                <p><strong>Patient ID:</strong> {booking.patient_id}</p>
                <p><strong>Booking ID:</strong> {booking.booking_id}</p>
                <p><strong>Doctor:</strong> {booking.doctor_name || booking.doctor}</p>
                <p><strong>Treatment:</strong> {booking.treatments}</p>
                <p><strong>Date:</strong> {new Date(booking.preferred_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <button
              onClick={downloadPDF}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Download Discharge Summary PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
