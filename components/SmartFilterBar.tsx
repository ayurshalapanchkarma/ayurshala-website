import { Search, Plus, RefreshCw, Download, Filter } from 'lucide-react'

type Tab = 'today' | 'upcoming' | 'week' | 'completed' | 'cancelled' | 'rescheduled' | 'followups' | 'history'

interface SmartFilterBarProps {
  dark: boolean
  activeTab: Tab
  searchQuery: string
  selectedDoctor: string
  selectedTreatment: string
  selectedPayment: string
  selectedStatus: string
  onTabChange: (tab: Tab) => void
  onSearchChange: (query: string) => void
  onDoctorChange: (doctor: string) => void
  onTreatmentChange: (treatment: string) => void
  onPaymentChange: (payment: string) => void
  onStatusChange: (status: string) => void
  onRefresh: () => void
  onExport: () => void
  onNewAppointment: () => void
}

export default function SmartFilterBar({
  dark,
  activeTab,
  searchQuery,
  selectedDoctor,
  selectedTreatment,
  selectedPayment,
  selectedStatus,
  onTabChange,
  onSearchChange,
  onDoctorChange,
  onTreatmentChange,
  onPaymentChange,
  onStatusChange,
  onRefresh,
  onExport,
  onNewAppointment,
}: SmartFilterBarProps) {
  const tabs: { value: Tab; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'week', label: 'This Week' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'followups', label: 'Follow-ups' },
    { value: 'history', label: 'History' },
  ]

  const cardStyle = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(40px)',
    border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 8px 32px rgba(232,98,26,0.08)',
  }

  return (
    <div className="rounded-xl p-4 mb-6" style={cardStyle}>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-orange-500 text-white'
                : dark
                  ? 'bg-gray-800/60 text-gray-300 border border-gray-700 hover:bg-gray-700/80'
                  : 'bg-white/40 text-stone-700 border border-white/60 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Search */}
        <div className={`flex-1 min-w-[200px] flex items-center gap-2 px-3 py-2 rounded-lg border ${dark ? 'bg-gray-800/40 border-gray-700' : 'bg-white/40 border-white/60'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or booking..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`bg-transparent outline-none text-xs w-full ${dark ? 'text-gray-200 placeholder-gray-500' : 'text-stone-700 placeholder-stone-400'}`}
          />
        </div>

        {/* Filter Dropdowns */}
        <select
          value={selectedDoctor}
          onChange={(e) => onDoctorChange(e.target.value)}
          className={`px-3 py-2 rounded-lg text-xs border transition ${dark ? 'bg-gray-800/40 border-gray-700 text-gray-200' : 'bg-white/40 border-white/60 text-stone-700'}`}
        >
          <option value="">All Doctors</option>
          <option value="dr1">Dr. Sharma</option>
        </select>

        <select
          value={selectedTreatment}
          onChange={(e) => onTreatmentChange(e.target.value)}
          className={`px-3 py-2 rounded-lg text-xs border transition ${dark ? 'bg-gray-800/40 border-gray-700 text-gray-200' : 'bg-white/40 border-white/60 text-stone-700'}`}
        >
          <option value="">All Treatments</option>
          <option value="abhyanga">Abhyanga</option>
          <option value="nasya">Nasya</option>
        </select>

        <select
          value={selectedPayment}
          onChange={(e) => onPaymentChange(e.target.value)}
          className={`px-3 py-2 rounded-lg text-xs border transition ${dark ? 'bg-gray-800/40 border-gray-700 text-gray-200' : 'bg-white/40 border-white/60 text-stone-700'}`}
        >
          <option value="">All Payment</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className={`p-2 rounded-lg border transition ${dark ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-700/60 text-gray-300' : 'bg-white/40 border-white/60 hover:bg-white/60 text-stone-600'}`}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExport}
            className={`p-2 rounded-lg border transition ${dark ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-700/60 text-gray-300' : 'bg-white/40 border-white/60 hover:bg-white/60 text-stone-600'}`}
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onNewAppointment}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-white text-xs font-medium transition bg-orange-500 hover:bg-orange-600`}
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>
    </div>
  )
}
