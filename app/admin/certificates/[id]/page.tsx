'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Home, Download, Edit, Trash2, Loader } from 'lucide-react'
import { useTheme } from 'next-themes'

type Certificate = {
  id: string
  certificate_no: string
  patient_uuid: string
  booking_uuid?: string
  certificate_type_id: string
  issue_date: string
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED'
  issued_by: string
  valid_from?: string
  valid_to?: string
  purpose?: string
  diagnosis?: string
  treatment_details?: string
  recommendations?: string
  restrictions?: string
  additional_notes?: string
  created_at: string
  patient?: { full_name: string; patient_id: string; email: string; phone: string }
  certificate_type?: { name: string }
  booking?: { booking_id: string; booking_type: string; preferred_date: string }
}

export default function CertificateDetailPage() {
  const params = useParams()
  const certificateId = params.id as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  useEffect(() => {
    loadCertificate()
  }, [certificateId])

  async function loadCertificate() {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        patient:patient_uuid(full_name, patient_id, email, phone),
        certificate_type:certificate_type_id(name),
        booking:booking_uuid(booking_id, booking_type, preferred_date)
      `)
      .eq('id', certificateId)
      .single()

    if (!error && data) {
      setCertificate(data)
    }
    setLoading(false)
  }

  async function downloadPDF() {
    if (!certificate) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/download`)
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificate.certificate_no}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download error:', error)
    }
    setDownloading(false)
  }

  async function cancelCertificate() {
    if (!certificate) return
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return

    setCancelling(true)
    const { error } = await supabase
      .from('certificates')
      .update({
        status: 'CANCELLED',
        cancel_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateId)

    setCancelling(false)
    if (!error) {
      loadCertificate()
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'} flex items-center justify-center`}>
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>Certificate not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-serif mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              {certificate.certificate_no}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>
              {certificate.certificate_type?.name}
            </p>
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
          {/* Status */}
          <div className="mb-6 flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              certificate.status === 'ISSUED' ? 'bg-green-100/60 text-green-800 dark:bg-green-950/50 dark:text-green-200' :
              certificate.status === 'DRAFT' ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' :
              'bg-red-100/60 text-red-800 dark:bg-red-950/50 dark:text-red-200'
            }`}>
              {certificate.status}
            </span>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  CERTIFICATE NUMBER
                </p>
                <p className={`font-mono text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {certificate.certificate_no}
                </p>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  ISSUE DATE
                </p>
                <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                  {new Date(certificate.issue_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  ISSUED BY
                </p>
                <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                  {certificate.issued_by}
                </p>
              </div>

              {certificate.valid_from && (
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    VALID FROM
                  </p>
                  <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                    {new Date(certificate.valid_from).toLocaleDateString()}
                  </p>
                </div>
              )}

              {certificate.valid_to && (
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    VALID TO
                  </p>
                  <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                    {new Date(certificate.valid_to).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  PATIENT NAME
                </p>
                <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                  {certificate.patient?.full_name}
                </p>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  PATIENT ID
                </p>
                <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                  {certificate.patient?.patient_id}
                </p>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  EMAIL
                </p>
                <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                  {certificate.patient?.email}
                </p>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                  PHONE
                </p>
                <p className={isDark ? 'text-gray-200' : 'text-stone-900'}>
                  {certificate.patient?.phone}
                </p>
              </div>

              {certificate.booking && (
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    BOOKING
                  </p>
                  <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.booking.booking_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Details */}
          <div className={`mt-8 border-t ${isDark ? 'border-slate-700/30' : 'border-white/20'}`}>
            <div className="pt-8 space-y-6">
              {certificate.purpose && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    PURPOSE
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.purpose}
                  </p>
                </div>
              )}

              {certificate.diagnosis && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    DIAGNOSIS
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.diagnosis}
                  </p>
                </div>
              )}

              {certificate.treatment_details && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    TREATMENT DETAILS
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.treatment_details}
                  </p>
                </div>
              )}

              {certificate.recommendations && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    RECOMMENDATIONS
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.recommendations}
                  </p>
                </div>
              )}

              {certificate.restrictions && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    RESTRICTIONS
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.restrictions}
                  </p>
                </div>
              )}

              {certificate.additional_notes && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>
                    ADDITIONAL NOTES
                  </p>
                  <p className={`whitespace-pre-line ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                    {certificate.additional_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={`mt-8 flex gap-3 border-t pt-6 ${isDark ? 'border-slate-700/30' : 'border-white/20'}`}>
            {certificate.status === 'ISSUED' && (
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 transition">
                {downloading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Download PDF
              </button>
            )}

            {certificate.status !== 'CANCELLED' && (
              <button
                onClick={cancelCertificate}
                disabled={cancelling}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition">
                {cancelling ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                Cancel Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
