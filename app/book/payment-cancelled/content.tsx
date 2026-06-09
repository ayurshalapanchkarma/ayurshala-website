'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function PaymentCancelledContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('order_id')

  return (
    <div className="min-h-screen px-4 py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#fdf6ee,#ffecd2)' }}>
      <div className="max-w-md mx-auto relative">
        <Link href="/" className="block mb-8 text-center">
          <img src="/ayurshala_text.png" alt="Ayurshala" width="160" height="48" className="h-12 w-auto object-contain inline-block" />
        </Link>

        <div className="rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(254,226,226,0.98) 0%, rgba(254,200,200,0.95) 100%)', backdropFilter: 'blur(50px)', border: '1px solid rgba(220,38,38,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 60px rgba(220,38,38,0.15), 0 8px 30px rgba(0,0,0,0.08)' }}>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-serif text-2xl mb-2" style={{ color: '#991b1b' }}>Payment Cancelled</h1>
          <p className="font-sans text-sm text-red-700 mb-6">You cancelled the payment. Your booking was not confirmed.</p>

          {orderId && (
            <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              Order ID: <strong>{orderId}</strong>
            </p>
          )}

          <p className="font-sans text-sm text-stone-600 mb-8">You can try booking again or choose Cash on Arrival payment option.</p>

          <div className="flex flex-col gap-3">
            <Link href="/book" className="btn-glass w-full py-3 text-center font-semibold">
              Try Booking Again
            </Link>
            <Link href="/" className="btn-glass w-full py-3 text-center font-semibold flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
