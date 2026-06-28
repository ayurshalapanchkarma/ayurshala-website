import { Calendar, Clock, Wallet, TrendingUp } from 'lucide-react'

interface KPICard {
  label: string
  value: string | number
  icon: React.ReactNode
  bgColor: string
}

interface KPISummaryProps {
  dark: boolean
  stats: {
    today: number
    pending: number
    checkedIn: number
    waiting: number
    completed: number
    cancelled: number
    cashPending: number
    todayRevenue: number
  }
}

export default function KPISummary({ dark, stats }: KPISummaryProps) {
  const kpis: KPICard[] = [
    {
      label: "Today's Appointments",
      value: stats.today,
      icon: <Calendar className="w-5 h-5" />,
      bgColor: dark ? 'from-blue-950 to-blue-900' : 'from-blue-50 to-blue-100',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      bgColor: dark ? 'from-yellow-950 to-yellow-900' : 'from-yellow-50 to-yellow-100',
    },
    {
      label: 'Checked-In',
      value: stats.checkedIn,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: dark ? 'from-green-950 to-green-900' : 'from-green-50 to-green-100',
    },
    {
      label: 'Waiting',
      value: stats.waiting,
      icon: <Clock className="w-5 h-5" />,
      bgColor: dark ? 'from-orange-950 to-orange-900' : 'from-orange-50 to-orange-100',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: dark ? 'from-purple-950 to-purple-900' : 'from-purple-50 to-purple-100',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: <Calendar className="w-5 h-5" />,
      bgColor: dark ? 'from-red-950 to-red-900' : 'from-red-50 to-red-100',
    },
    {
      label: 'Cash Pending',
      value: stats.cashPending,
      icon: <Wallet className="w-5 h-5" />,
      bgColor: dark ? 'from-orange-950 to-orange-900' : 'from-orange-50 to-orange-100',
    },
    {
      label: "Today's Revenue",
      value: `₹${stats.todayRevenue}`,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: dark ? 'from-green-950 to-green-900' : 'from-green-50 to-green-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-4 bg-gradient-to-br ${kpi.bgColor} border transition backdrop-blur-md ${
            dark ? 'border-white/10' : 'border-white/40'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              {kpi.label}
            </p>
            <span style={{ color: '#E8621A' }}>{kpi.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
        </div>
      ))}
    </div>
  )
}
