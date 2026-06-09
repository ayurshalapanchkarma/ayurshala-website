import { Suspense } from 'react'
import PaymentCancelledContent from './content'

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen px-4 py-20" style={{ background: 'linear-gradient(135deg,#fdf6ee,#ffecd2)' }}>
        <div className="max-w-md mx-auto text-center">
          <p className="font-sans">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  )
}
