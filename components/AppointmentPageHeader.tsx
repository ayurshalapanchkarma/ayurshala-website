import { Clock, Moon, Sun, Home, FileText, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminBackButton } from './AdminBackButton'

interface HeaderProps {
  dark: boolean
  currentTime: string
  onThemeToggle: () => void
  onLogout: () => void
  onNewAppointment: () => void
}

export default function AppointmentPageHeader({
  dark,
  currentTime,
  onThemeToggle,
  onLogout,
  onNewAppointment,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 min-w-0">
        <AdminBackButton dark={dark} />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#E8621A' }}>
            Appointments
          </h1>
          <p className={`text-xs sm:text-sm ${dark ? 'text-gray-400' : 'text-stone-500'}`}>
            Manage patient appointments and daily operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`px-3 py-2 rounded-lg text-xs font-mono ${dark ? 'bg-gray-800/60 text-gray-300' : 'bg-white/40 text-stone-600'}`}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{currentTime}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded-lg transition border ${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white/40 text-stone-700 border-white/60 hover:bg-white/60'}`}
            title="Toggle dark mode"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/"
            className={`p-2 rounded-lg transition border flex items-center ${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white/40 text-stone-700 border-white/60 hover:bg-white/60'}`}
            title="Home"
          >
            <Home className="w-4 h-4" />
          </Link>

          <Link
            href="/admin/certificates"
            className={`p-2 rounded-lg transition border flex items-center ${dark ? 'bg-gray-800/60 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white/40 text-stone-700 border-white/60 hover:bg-white/60'}`}
            title="Certificates"
          >
            <FileText className="w-4 h-4" />
          </Link>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition border border-red-600"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
