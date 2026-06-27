'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowUp, ArrowDown, Users, Calendar, TrendingUp, Activity } from 'lucide-react'

// Simple inline button to avoid import issues
function Button({ children, ...props }: any) {
  return (
    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition" {...props}>
      {children}
    </button>
  )
}

const dashboardData = {
  revenue: [
    { month: 'Jan', value: 45000 },
    { month: 'Feb', value: 52000 },
    { month: 'Mar', value: 48000 },
    { month: 'Apr', value: 61000 },
    { month: 'May', value: 55000 },
    { month: 'Jun', value: 67000 },
  ],
  patientStats: [
    { name: 'New', value: 120, fill: '#10b981' },
    { name: 'Returning', value: 340, fill: '#f59e0b' },
    { name: 'Inactive', value: 89, fill: '#94a3b8' },
  ],
  appointments: [
    { status: 'Scheduled', count: 45 },
    { status: 'Completed', count: 128 },
    { status: 'Cancelled', count: 8 },
  ],
}

function StatCard({ label, value, change, icon: Icon }: any) {
  const isPositive = change >= 0
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          <p className={`text-sm mt-2 flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change)}% vs last month
          </p>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
          <Icon size={24} className="text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Patients" value="549" change={12.5} icon={Users} />
        <StatCard label="Appointments" value="173" change={8.2} icon={Calendar} />
        <StatCard label="Monthly Revenue" value="₹67,000" change={15.8} icon={TrendingUp} />
        <StatCard label="Treatments" value="342" change={-2.1} icon={Activity} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis stroke="rgba(0,0,0,0.5)" />
                <YAxis stroke="rgba(0,0,0,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard title="Patient Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dashboardData.patientStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {dashboardData.patientStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {dashboardData.appointments.map((item) => (
            <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">{item.status}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
