import { X, Phone, Mail, Clock, Stethoscope, FileText } from 'lucide-react'

interface RowBooking {
  id: number
  booking_id: string
  preferred_date: string
  preferred_time: string
  booking_type: string
  status: string
  payment_status: string
  payment_method: string
  patient_name: string
  patient_phone: string
  patient_email: string
  treatments: string
  amount?: number
  amount_paid?: number
  created_at?: string
  patient_id?: string
}

interface RowDetailsDrawerProps {
  dark: boolean
  booking: any | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onCheckIn: () => void
  onInvoice: () => void
  getStatusBadge: (booking: any) => { label: string; cls: string }
  getPaymentBadge: (booking: any) => { label: string; cls: string }
}

export default function RowDetailsDrawer({
  dark,
  booking,
  isOpen,
  onClose,
  onEdit,
  onCheckIn,
  onInvoice,
  getStatusBadge,
  getPaymentBadge,
}: RowDetailsDrawerProps) {
  if (!isOpen || !booking) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 transition-transform overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: dark
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #fdf6ee 0%, #ffecd2 100%)',
        }}
      >
        <div className="sticky top-0 p-6 border-b" style={{
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
              Appointment Details
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition ${
                dark
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-stone-600 hover:text-stone-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking ID */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Booking ID
            </p>
            <p className="font-mono font-bold text-lg" style={{ color: '#E8621A' }}>
              {booking.booking_id}
            </p>
          </div>

          {/* Patient Details */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Patient Details
            </p>
            <div className="space-y-2">
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>
                {booking.patient_name}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 opacity-60" />
                <a href={`tel:${booking.patient_phone}`} className="hover:underline">
                  {booking.patient_phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 opacity-60" />
                <a href={`mailto:${booking.patient_email}`} className="hover:underline">
                  {booking.patient_email}
                </a>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Appointment
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 opacity-60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={dark ? 'text-gray-300' : 'text-stone-700'}>
                    {new Date(booking.preferred_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className={dark ? 'text-gray-400' : 'text-stone-600'}>{booking.preferred_time}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Stethoscope className="w-4 h-4 opacity-60 flex-shrink-0 mt-0.5" />
                <p className={dark ? 'text-gray-300' : 'text-stone-700'}>{booking.treatments}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Status
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusBadge(booking).cls}`}>
              {getStatusBadge(booking).label}
            </span>
          </div>

          {/* Payment */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Payment
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getPaymentBadge(booking).cls}`}>
              {getPaymentBadge(booking).label}
            </span>
            {booking.amount && (
              <p className={`text-sm mt-2 ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Amount: ₹{booking.amount}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-6" style={{
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
          }}>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Quick Actions
            </p>
            <div className="grid gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
              >
                Edit
              </button>
              <button
                onClick={onCheckIn}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition"
              >
                Check In
              </button>
              <button
                onClick={onInvoice}
                className="px-4 py-2 rounded-lg flex items-center gap-2 justify-center bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
              >
                <FileText className="w-4 h-4" />
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
