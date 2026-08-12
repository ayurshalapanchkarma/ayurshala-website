'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import GlassBackground from '@/components/GlassBackground'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function AdminCancelledContent() {
  const params = useSearchParams()
  const bookingId = params.get('booking_id')
  const patientName = params.get('patient_name')
  const appointmentDate = params.get('appointment_date')
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const dark = mounted && theme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-20 sm:py-24 relative overflow-hidden"
      style={{
        background: dark
          ? 'linear-gradient(135deg,#0a0f0a,#1a1008)'
          : 'linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0)',
      }}
    >
      <GlassBackground />
      <div className="max-w-2xl mx-auto relative">
        <Link href="/">
          <Image
            src="/ayurshala_text.png"
            alt="Ayurshala"
            width={160}
            height={48}
            className="object-contain h-10 sm:h-12 w-auto mb-8 sm:mb-12"
          />
        </Link>

        <div
          className="rounded-3xl p-8 sm:p-12 border text-center"
          style={{
            background: dark
              ? 'linear-gradient(135deg,rgba(20,83,45,0.15) 0%,rgba(16,185,129,0.1) 100%)'
              : 'linear-gradient(135deg,rgba(20,83,45,0.08) 0%,rgba(132,204,22,0.04) 100%)',
            border: dark
              ? '1px solid rgba(16,185,129,0.3)'
              : '1px solid rgba(16,185,129,0.2)',
            boxShadow: dark
              ? 'inset 0 1px 0 rgba(34,197,94,0.1), 0 20px 60px rgba(16,185,129,0.1), 0 8px 30px rgba(0,0,0,0.1)'
              : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(16,185,129,0.1), 0 8px 30px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(40px)',
          }}
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
              style={{
                background: dark
                  ? 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(34,197,94,0.15))'
                  : 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(132,204,22,0.05))',
                border: '2px solid ' + (dark ? 'rgba(52,211,153,0.4)' : 'rgba(34,197,94,0.3)'),
              }}
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                  style={{ color: '#16a34a' }}
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1
            className="font-serif text-3xl sm:text-4xl font-light mb-2"
            style={{ color: dark ? '#86efac' : '#16a34a' }}
          >
            Booking Cancelled
          </h1>

          {/* Booking ID */}
          {bookingId && (
            <p className="font-sans text-xs sm:text-sm font-semibold mb-6" style={{ color: '#E8621A' }}>
              Booking ID: {bookingId}
            </p>
          )}

          {/* Cancellation Details Card */}
          <div
            className="rounded-2xl p-6 mb-8 border"
            style={{
              background: dark
                ? 'rgba(6,78,59,0.2)'
                : 'rgba(16,185,129,0.05)',
              border: dark
                ? '1px solid rgba(16,185,129,0.2)'
                : '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <h2
              className="font-sans text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: dark ? '#86efac' : '#16a34a' }}
            >
              Cancellation Details
            </h2>

            <div className="space-y-3 text-left">
              {bookingId && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: dark
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(16,185,129,0.05)',
                  }}
                >
                  <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Booking ID</span>
                  <span
                    className="font-sans text-sm font-semibold"
                    style={{ color: '#E8621A' }}
                  >
                    {bookingId}
                  </span>
                </div>
              )}

              {patientName && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: dark
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(16,185,129,0.05)',
                  }}
                >
                  <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Patient Name</span>
                  <span
                    className="font-sans text-sm font-semibold"
                    style={{ color: dark ? '#e2e8f0' : '#1a1008' }}
                  >
                    {patientName}
                  </span>
                </div>
              )}

              {appointmentDate && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    background: dark
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(16,185,129,0.05)',
                  }}
                >
                  <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Appointment Date</span>
                  <span
                    className="font-sans text-sm font-semibold"
                    style={{ color: dark ? '#e2e8f0' : '#1a1008' }}
                  >
                    {appointmentDate}
                  </span>
                </div>
              )}

              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: dark
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(16,185,129,0.05)',
                }}
              >
                <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Cancelled By</span>
                <span
                  className="font-sans text-sm font-semibold"
                  style={{ color: dark ? '#e2e8f0' : '#1a1008' }}
                >
                  Administrator
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  background: dark
                    ? 'rgba(16,185,129,0.1)'
                    : 'rgba(16,185,129,0.05)',
                }}
              >
                <span className="font-sans text-xs text-stone-500 dark:text-stone-400">Cancelled At</span>
                <span
                  className="font-sans text-sm font-semibold"
                  style={{ color: dark ? '#e2e8f0' : '#1a1008' }}
                >
                  {new Date().toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <p
            className="font-sans text-sm mb-8"
            style={{ color: dark ? '#cbd5e1' : '#3f3f3f' }}
          >
            The patient has been notified via email about this cancellation.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin"
              className="flex-1 py-3 px-6 rounded-xl font-sans font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: '#16a34a',
              }}
            >
              Open Admin Dashboard
            </Link>
            <Link
              href={`/admin/bookings?search=${bookingId}`}
              className="flex-1 py-3 px-6 rounded-xl font-sans font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: '#E8621A',
              }}
            >
              View Booking
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p
            className="font-sans text-xs"
            style={{ color: dark ? '#94a3b8' : '#a8a29e' }}
          >
            Ayurshala Panchakarma Center • SP-28, Wajidpur, Sector-130, Noida — 201301
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminCancelledPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminCancelledContent />
    </Suspense>
  )
}
