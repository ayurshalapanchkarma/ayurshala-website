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
  const [badgeVisible, setBadgeVisible] = useState(true)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-white to-orange-100/40 p-4">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: '#6B7280' }}>Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (status === 'verified' && data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-white to-orange-100/40 p-4 py-12">
        <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/50 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Panchakarma Center"
              width={90}
              height={90}
              className="w-[70px] md:w-[90px] h-auto"
            />
          </div>

          {/* Title with Badge */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <h1 style={{ color: '#1D9BF0', fontFamily: 'Poppins', lineHeight: '1.1', margin: 0 }} className="text-2xl md:text-4xl font-bold">
              Certificate Verified
            </h1>
            {badgeVisible && (
              <Image
                src="/meta-verified.png"
                alt="Verified"
                width={32}
                height={32}
                className="w-6 md:w-8 h-auto object-contain flex-shrink-0"
                style={{ verticalAlign: 'baseline' }}
                priority
                onError={() => setBadgeVisible(false)}
              />
            )}
          </div>

          {/* Details Card */}
          <div className="backdrop-blur bg-white/30 border border-white/20 rounded-2xl p-6 md:p-8 mb-8 text-left space-y-5">
            <DetailRow label="Certificate Number" value={data.certificateNo} />
            <DetailRow label="Certificate Type" value={data.certificateType} />
            <DetailRow label="Patient Name" value={data.patientName} />
            <DetailRow label="Issue Date" value={data.issueDate} />
            <DetailRow label="Issued By" value={`Dr. ${data.issuedBy}`} />
            <DetailRow label="Verification Timestamp" value={data.verifiedAt} />
          </div>

          {/* Trust Section */}
          <div className="border-t border-white/20 pt-8 mb-6">
            <p style={{ color: '#6B7280' }} className="text-sm mb-4">
              Verified and digitally authenticated by
            </p>
            <p style={{ color: '#EA580C' }} className="text-2xl font-bold mb-4">
              Ayurshala Panchakarma Center
            </p>
            <div style={{ color: '#6B7280' }} className="text-sm space-y-1">
              <p>SP-28, Wajidpur, Sector-130, Noida – 201301</p>
              <p>+91-9821224767</p>
              <a href="mailto:ayurshalapanchkarma@gmail.com" style={{ color: '#EA580C' }} className="hover:opacity-80 transition">
                ayurshalapanchkarma@gmail.com
              </a>
            </div>
          </div>

          {/* Authenticity Note */}
          <div className="flex items-start justify-center gap-2" style={{ color: '#EA580C' }}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: '0.875rem' }}>This certificate has been digitally verified against Ayurshala's official records.</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-white to-orange-100/40 p-4 py-12">
        <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/50 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Panchakarma Center"
              width={90}
              height={90}
              className="w-[70px] md:w-[90px] h-auto"
            />
          </div>
          <div className="flex justify-center mb-6">
            <div style={{ color: '#EA580C' }} className="text-5xl">✗</div>
          </div>
          <h1 style={{ color: '#EA580C' }} className="text-3xl font-bold mb-4">
            Invalid Certificate
          </h1>
          <p style={{ color: '#6B7280' }} className="mb-8">
            The certificate you are trying to verify does not exist or is invalid.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ backgroundColor: '#EA580C' }}
            className="hover:opacity-90 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-white to-orange-100/40 p-4 py-12">
        <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/50 border border-white/30 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/ayurshala_text.png"
              alt="Ayurshala Panchakarma Center"
              width={90}
              height={90}
              className="w-[70px] md:w-[90px] h-auto"
            />
          </div>
          <div className="flex justify-center mb-6">
            <div style={{ color: '#EA580C' }} className="text-5xl">⚠</div>
          </div>
          <h1 style={{ color: '#EA580C' }} className="text-3xl font-bold mb-4">
            Certificate Not Active
          </h1>
          <p style={{ color: '#6B7280' }} className="mb-8">
            This certificate exists but is not currently active.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ backgroundColor: '#EA580C' }}
            className="hover:opacity-90 text-white px-6 py-3 rounded-lg transition font-semibold"
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
      <p style={{ color: '#6B7280', fontSize: '0.875rem' }} className="mb-1">
        {label}
      </p>
      <p style={{ color: '#111827' }} className="text-base font-semibold">
        {value}
      </p>
    </div>
  )
}
