import { Clock, User, Stethoscope, MoreVertical } from 'lucide-react'

interface AppointmentQueueCard {
  id: string
  bookingId: string
  time: string
  patientName: string
  treatment: string
  doctor: string
  status: 'confirmed' | 'checked-in' | 'in-treatment' | 'waiting' | 'completed'
  onQuickAction: (action: string) => void
}

interface TodaysQueueProps {
  dark: boolean
  appointments: AppointmentQueueCard[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
    case 'checked-in':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
    case 'in-treatment':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300'
  }
}

export default function TodaysQueue({ dark, appointments }: TodaysQueueProps) {
  if (appointments.length === 0) {
    return (
      <div className="mb-6 rounded-xl p-6 text-center" style={{
        background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(40px)',
        border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
      }}>
        <p className={`${dark ? 'text-gray-400' : 'text-stone-500'}`}>
          No appointments scheduled for today
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: '#E8621A' }}>
        Today's Queue
      </h2>
      <div className="grid gap-3">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className={`rounded-lg p-4 border transition ${
              dark
                ? 'bg-gray-900/40 border-white/10 hover:bg-gray-900/60'
                : 'bg-white/60 border-white/40 hover:bg-white/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#E8621A' }} />
                  <span className="font-mono font-bold text-sm" style={{ color: '#E8621A' }}>
                    {apt.time}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>

                <p className={`font-semibold text-sm mb-1 truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {apt.patientName}
                </p>

                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3 flex-shrink-0 opacity-60" />
                    <span className={dark ? 'text-gray-400' : 'text-stone-600'}>{apt.treatment}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 flex-shrink-0 opacity-60" />
                    <span className={dark ? 'text-gray-400' : 'text-stone-600'}>{apt.doctor}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => apt.onQuickAction('menu')}
                className={`p-1.5 rounded-lg transition ${
                  dark
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-stone-600 hover:text-stone-800'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
