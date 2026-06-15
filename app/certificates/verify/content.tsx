'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'verified' | 'invalid' | 'inactive'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const certificateNo = searchParams.get('certificate')
    if (!certificateNo) {
      setStatus('invalid')
      return
    }

    const verify = async () => {
      try {
        const { data: cert, error } = await supabase
          .from('certificates')
          .select(`
            id, certificate_no, status,
            patient:patient_uuid(full_name),
            certificate_type_id,
            issue_date, issued_by
          `)
          .eq('certificate_no', certificateNo)
          .single()

        if (error || !cert) {
          setStatus('invalid')
          return
        }

        if (cert.status !== 'ISSUED') {
          setStatus('inactive')
          return
        }

        const { data: certType } = await supabase
          .from('certificate_types')
          .select('name')
          .eq('id', cert.certificate_type_id)
          .single()

        setData({
          certificateNo: cert.certificate_no,
          certificateType: certType?.name || 'Unknown',
          patientName: (cert.patient as any)?.full_name || 'Unknown',
          issueDate: new Date(cert.issue_date).toLocaleDateString('en-IN'),
          issuedBy: cert.issued_by,
          verifiedAt: new Date().toLocaleString('en-IN'),
        })
        setStatus('verified')
      } catch (e) {
        setStatus('invalid')
      }
    }

    verify()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (status === 'verified' && data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-green-700 mb-6">Certificate Verified</h1>
          <div className="bg-gray-50 rounded p-4 text-left space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-600">Certificate Number</p>
              <p className="font-semibold text-gray-900">{data.certificateNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Certificate Type</p>
              <p className="font-semibold text-gray-900">{data.certificateType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patient Name</p>
              <p className="font-semibold text-gray-900">{data.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Issue Date</p>
              <p className="font-semibold text-gray-900">{data.issueDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Issued By</p>
              <p className="font-semibold text-gray-900">Dr. {data.issuedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Verification Timestamp</p>
              <p className="font-semibold text-gray-900">{data.verifiedAt}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-3">Issued by</p>
            <p className="font-semibold text-lg text-orange-600">Ayurshala Panchakarma Center</p>
            <p className="text-xs text-gray-500 mt-1">www.ayurshalapanchakarma.com</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✗</div>
          <h1 className="text-3xl font-bold text-red-700 mb-6">Invalid Certificate</h1>
          <p className="text-gray-600 mb-6">The certificate you are trying to verify does not exist or is invalid.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">⚠</div>
          <h1 className="text-3xl font-bold text-yellow-700 mb-6">Certificate Not Active</h1>
          <p className="text-gray-600 mb-6">This certificate exists but is not currently active.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }
}
