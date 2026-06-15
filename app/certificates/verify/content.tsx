'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

export default function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'verified' | 'invalid' | 'inactive'>('loading')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    console.log(
      '[VERIFY]',
      'url:',
      !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'anon:',
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'publishable:',
      !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
      } catch (error) {
        console.error('[CERTIFICATE VERIFY PAGE]', error)
        setStatus('invalid')
      }
    }

    verify()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-green-100 p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
        `}</style>
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ fontFamily: 'Inter' }} className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (status === 'verified' && data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-green-100 p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
        `}</style>
        <div className="w-full max-w-2xl backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Panchakarma Center"
              width={90}
              height={90}
              className="w-[70px] md:w-[90px] h-auto"
            />
          </div>

          {/* Verification Badge */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center shadow-lg" aria-label="Certificate verified">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: 'Playfair Display' }} className="text-4xl font-bold text-emerald-700 mb-8">
            Certificate Verified
          </h1>

          {/* Details Card */}
          <div className="bg-gray-50/50 backdrop-blur rounded-2xl p-6 md:p-8 mb-8 text-left space-y-6">
            <DetailRow label="Certificate Number" value={data.certificateNo} />
            <DetailRow label="Certificate Type" value={data.certificateType} />
            <DetailRow label="Patient Name" value={data.patientName} />
            <DetailRow label="Issue Date" value={data.issueDate} />
            <DetailRow label="Issued By" value={`Dr. ${data.issuedBy}`} />
            <DetailRow label="Verification Timestamp" value={data.verifiedAt} />
          </div>

          {/* Trust Section */}
          <div className="border-t border-gray-200 pt-8 mb-6">
            <p style={{ fontFamily: 'Inter' }} className="text-gray-700 font-semibold mb-4">
              Verified and digitally authenticated by
            </p>
            <p style={{ fontFamily: 'Playfair Display' }} className="text-2xl font-bold text-emerald-700 mb-4">
              Ayurshala Panchakarma Center
            </p>
            <div style={{ fontFamily: 'Inter' }} className="text-sm text-gray-600 space-y-1">
              <p>SP-28, Wajidpur, Sector-130, Noida – 201301</p>
              <p>+91-9821224767</p>
              <a href="mailto:ayurshalapanchkarma@gmail.com" className="text-emerald-600 hover:text-emerald-700">
                ayurshalapanchkarma@gmail.com
              </a>
            </div>
          </div>

          {/* Authenticity Note */}
          <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p style={{ fontFamily: 'Inter' }}>This certificate has been validated against Ayurshala's official records.</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-red-50 to-pink-100 p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
        `}</style>
        <div className="w-full max-w-2xl backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display' }} className="text-3xl font-bold text-red-700 mb-4">
            Invalid Certificate
          </h1>
          <p style={{ fontFamily: 'Inter' }} className="text-gray-600 mb-8">
            The certificate you are trying to verify does not exist or is invalid.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition font-semibold"
            style={{ fontFamily: 'Inter' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-yellow-50 to-amber-100 p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
        `}</style>
        <div className="w-full max-w-2xl backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display' }} className="text-3xl font-bold text-yellow-700 mb-4">
            Certificate Not Active
          </h1>
          <p style={{ fontFamily: 'Inter' }} className="text-gray-600 mb-8">
            This certificate exists but is not currently active.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition font-semibold"
            style={{ fontFamily: 'Inter' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'Inter' }} className="text-sm text-gray-500 mb-1">
        {label}
      </p>
      <p style={{ fontFamily: 'Inter' }} className="text-base font-semibold text-gray-900">
        {value}
      </p>
    </div>
  )
}
