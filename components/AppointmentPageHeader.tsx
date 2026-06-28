import { Clock, Moon, Sun, Home, LogOut, Bell } from 'lucide-react'
import Link from 'next/link'
import { AdminBackButton } from './AdminBackButton'

interface HeaderProps {
  dark: boolean
  currentTime: string
  onThemeToggle: () => void
  onLogout: () => void
}

export default function AppointmentPageHeader({
  dark,
  currentTime,
  onThemeToggle,
  onLogout,
}: HeaderProps) {
  return (
    <div
      className={`sticky top-0 z-40 border-b backdrop-blur-sm ${
        dark
          ? 'bg-gray-900/80 border-gray-800'
          : 'bg-white/80 border-gray-200'
      }`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 flex-1">
            <AdminBackButton dark={dark} />
            <div>
              <h1
                className="text-2xl font-bold leading-tight"
                style={{ color: '#F97316' }}
              >
                Appointments
              </h1>
              <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage patient appointments and daily operations
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 ${
                dark
                  ? 'bg-gray-800/60 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{currentTime}</span>
            </div>

            <button
              onClick={onThemeToggle}
              className={`p-1.5 rounded-lg transition ${
                dark
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
              }`}
              title="Toggle theme"
            >
              {dark ? (
                <Sun className="w-4 h-4 text-gray-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600" />
              )}
            </button>

            <button
              className={`p-1.5 rounded-lg transition relative ${
                dark
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
              }`}
              title="Notifications"
            >
              <Bell className={`w-4 h-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <Link
              href="/"
              className={`p-1.5 rounded-lg transition ${
                dark
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-100'
              }`}
              title="Home"
            >
              <Home className={`w-4 h-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`} />
            </Link>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
