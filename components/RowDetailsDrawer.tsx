import { X, Phone, Mail, Clock, Stethoscope, FileText, Edit, Check, Download, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface RowDetailsDrawerProps {
  dark: boolean
  booking: any | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onCheckIn: () => Promise<void>
  onInvoice: () => Promise<void>
  onReschedule: () => void
  onCancel: () => void
  onDischarge: () => void
  getStatusBadge: (booking: any) => { label: string; cls: string }
  getPaymentBadge: (booking: any) => { label: string; cls: string }
  loading: boolean
}

export default function RowDetailsDrawer({
  dark,
  booking,
  isOpen,
  onClose,
  onEdit,
  onCheckIn,
  onInvoice,
  onReschedule,
  onCancel,
  onDischarge,
  getStatusBadge,
  getPaymentBadge,
  loading,
}: RowDetailsDrawerProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!isOpen || !booking) return null

  const handleCheckIn = async () => {
    setActionLoading('checkin')
    try {
      await onCheckIn()
    } finally {
      setActionLoading(null)
    }
  }

  const handleInvoice = async () => {
    setActionLoading('invoice')
    try {
      await onInvoice()
    } finally {
      setActionLoading(null)
    }
  }

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
        {/* Header */}
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

        {/* Content */}
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

          {/* Doctor */}
          <div>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Assigned Doctor
            </p>
            <p className={`text-sm ${dark ? 'text-gray-200' : 'text-stone-700'}`}>
              {booking.doctor_name || booking.doctor || 'Doctor Not Assigned'}
            </p>
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

          {/* Status & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
                Status
              </p>
              <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getStatusBadge(booking).cls}`}>
                {getStatusBadge(booking).label}
              </span>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
                Payment
              </p>
              <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${getPaymentBadge(booking).cls}`}>
                {getPaymentBadge(booking).label}
              </span>
            </div>
          </div>

          {booking.amount && (
            <div className={`p-3 rounded-lg ${dark ? 'bg-gray-800/50' : 'bg-orange-50'}`}>
              <p className={`text-xs uppercase tracking-wider font-semibold ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
                Amount
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: '#E8621A' }}>₹{booking.amount}</p>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
                Notes
              </p>
              <p className={`text-sm ${dark ? 'text-gray-300' : 'text-stone-700'}`}>{booking.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t pt-6" style={{
            borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
          }}>
            <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
              Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onEdit}
                disabled={actionLoading !== null}
                className="px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleCheckIn}
                disabled={actionLoading !== null || booking.status === 'IN_PROGRESS'}
                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {actionLoading === 'checkin' ? 'Processing...' : 'Check In'}
              </button>
              <button
                onClick={handleInvoice}
                disabled={actionLoading !== null}
                className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {actionLoading === 'invoice' ? 'Generating...' : 'Invoice'}
              </button>
              <button
                onClick={onReschedule}
                disabled={actionLoading !== null}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  dark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Reschedule
              </button>
              <button
                onClick={onCancel}
                disabled={actionLoading !== null}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  dark
                    ? 'bg-red-900/50 text-red-200 hover:bg-red-900'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={onDischarge}
                disabled={actionLoading !== null}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  dark
                    ? 'bg-purple-900/50 text-purple-200 hover:bg-purple-900'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Discharge
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
