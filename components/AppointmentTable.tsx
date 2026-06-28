import { MoreVertical } from 'lucide-react'

type Booking = {
  id: number
  booking_id: string
  preferred_date: string
  preferred_time: string
  booking_type: string
  status: string
  payment_status: string
  payment_method: string
  refund_status?: string
  refund_amount?: number
  amount?: number
  amount_paid?: number
  created_at: string
  patient_name: string
  patient_id: string
  patient_phone: string
  patient_email: string
  treatments: string
  rescheduled_at?: string
}

interface AppointmentTableProps {
  dark: boolean
  bookings: Booking[]
  loading: boolean
  onRowClick: (booking: Booking) => void
  onActionClick: (booking: Booking) => void
  getStatusBadge: (booking: Booking) => { label: string; cls: string }
  getPaymentBadge: (booking: Booking) => { label: string; cls: string }
  getAvailableActions: (booking: Booking) => string[]
}

export default function AppointmentTable({
  dark,
  bookings,
  loading,
  onRowClick,
  onActionClick,
  getStatusBadge,
  getPaymentBadge,
  getAvailableActions,
}: AppointmentTableProps) {
  if (loading) {
    return (
      <div className={`text-center py-12 text-sm ${dark ? 'text-gray-400' : 'text-stone-400'}`}>
        Loading appointments...
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className={`text-center py-12 text-sm ${dark ? 'text-gray-400' : 'text-stone-400'}`}>
        No appointments found
      </div>
    )
  }

  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 8px 32px rgba(232,98,26,0.08)',
  }

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(232,98,26,0.08)' }}>
            <tr className={`border-b ${dark ? 'border-white/10' : 'border-white/30'}`}>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Booking ID
              </th>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Patient
              </th>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Date & Time
              </th>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Treatment
              </th>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Status
              </th>
              <th className={`px-4 py-3 text-left font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Payment
              </th>
              <th className={`px-4 py-3 text-center font-semibold uppercase tracking-wider ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              return (
                <tr
                  key={booking.id}
                  onClick={() => onRowClick(booking)}
                  className={`border-b transition cursor-pointer ${
                    dark
                      ? 'bg-slate-900/30 hover:bg-slate-800/50 border-white/10'
                      : 'bg-white/60 hover:bg-white/80 border-white/20'
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-bold text-sm" style={{ color: '#E8621A' }}>
                    {booking.booking_id}
                  </td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-200' : 'text-stone-900'}`}>
                    <p className="font-semibold">{booking.patient_name}</p>
                    <p className={`text-xs ${dark ? 'text-gray-400' : 'text-stone-600'}`}>
                      {booking.patient_phone}
                    </p>
                  </td>
                  <td className={`px-4 py-3 text-xs ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                    <p className="font-medium">
                      {new Date(booking.preferred_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className={dark ? 'text-gray-400' : 'text-stone-500'}>{booking.preferred_time}</p>
                  </td>
                  <td className={`px-4 py-3 text-xs max-w-xs truncate ${dark ? 'text-gray-300' : 'text-stone-700'}`}>
                    {booking.treatments}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(booking).cls}`}>
                      {getStatusBadge(booking).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getPaymentBadge(booking).cls}`}>
                      {getPaymentBadge(booking).label}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <button
                      onClick={() => onActionClick(booking)}
                      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition ${
                        dark
                          ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-100 text-stone-600 hover:text-stone-800'
                      }`}
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
