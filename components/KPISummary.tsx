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
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      bgColor: 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30',
    },
    {
      label: 'Checked-In',
      value: stats.checkedIn,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30',
    },
    {
      label: 'Waiting',
      value: stats.waiting,
      icon: <Clock className="w-5 h-5" />,
      bgColor: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: 'from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: <Calendar className="w-5 h-5" />,
      bgColor: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30',
    },
    {
      label: 'Cash Pending',
      value: stats.cashPending,
      icon: <Wallet className="w-5 h-5" />,
      bgColor: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30',
    },
    {
      label: "Today's Revenue",
      value: `₹${stats.todayRevenue}`,
      icon: <TrendingUp className="w-5 h-5" />,
      bgColor: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30',
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
