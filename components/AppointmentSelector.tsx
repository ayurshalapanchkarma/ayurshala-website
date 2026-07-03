'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { AppointmentContext, searchAppointments, getRecentAppointments } from '@/lib/appointment-context'

interface AppointmentSelectorProps {
  onSelect: (context: AppointmentContext) => void
  isLoading?: boolean
}

export function AppointmentSelector({ onSelect, isLoading }: AppointmentSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AppointmentContext[]>([])
  const [recentAppointments, setRecentAppointments] = useState<{
    today: AppointmentContext[]
    yesterday: AppointmentContext[]
    last7days: AppointmentContext[]
  }>({ today: [], yesterday: [], last7days: [] })
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Load recent appointments on mount
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const recent = await getRecentAppointments()
        setRecentAppointments(recent)
      } catch (error) {
        console.error('Failed to load recent appointments:', error)
      }
    }
    loadRecent()
  }, [])

  // Search as user types
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchAppointments(query)
        setResults(searchResults)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Display options: search results if query, otherwise recent appointments
  const displayedOptions =
    query.length >= 2 ? results : []

  const hasRecentAppointments =
    recentAppointments.today.length > 0 ||
    recentAppointments.yesterday.length > 0 ||
    recentAppointments.last7days.length > 0

  const formatOption = (apt: AppointmentContext) => {
    const dateStr = apt.appointmentDate
      ? new Date(apt.appointmentDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'No date'

    return {
      id: apt.bookingUuid,
      display: `${apt.bookingNumber} • ${apt.patientName}`,
      subtitle: `${apt.patientId} • ${dateStr} • ${apt.doctorName}`,
    }
  }

  const handleSelect = (apt: AppointmentContext) => {
    setQuery('')
    setShowDropdown(false)
    onSelect(apt)
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, booking #, phone, or date"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            disabled={isLoading}
            className="flex-1 outline-none dark:bg-gray-800 dark:text-white"
          />
          {searching && <div className="text-xs text-gray-400">Searching...</div>}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50">
            {/* Search Results */}
            {query.length >= 2 && displayedOptions.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  Search Results ({displayedOptions.length})
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {displayedOptions.map((apt) => {
                    const fmt = formatOption(apt)
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => handleSelect(apt)}
                        className="w-full text-left px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-sm dark:text-white">{fmt.display}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{fmt.subtitle}</div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* No search results */}
            {query.length >= 2 && displayedOptions.length === 0 && !searching && (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                No appointments found
              </div>
            )}

            {/* Recent appointments (shown when no search) */}
            {query.length < 2 && hasRecentAppointments && (
              <div className="max-h-96 overflow-y-auto">
                {/* Today */}
                {recentAppointments.today.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      Today's Appointments
                    </div>
                    {recentAppointments.today.map((apt) => {
                      const fmt = formatOption(apt)
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => handleSelect(apt)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700"
                        >
                          <div className="font-medium text-sm dark:text-white">{fmt.display}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{fmt.subtitle}</div>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Yesterday */}
                {recentAppointments.yesterday.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      Yesterday
                    </div>
                    {recentAppointments.yesterday.map((apt) => {
                      const fmt = formatOption(apt)
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => handleSelect(apt)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700"
                        >
                          <div className="font-medium text-sm dark:text-white">{fmt.display}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{fmt.subtitle}</div>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Last 7 Days */}
                {recentAppointments.last7days.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      Last 7 Days
                    </div>
                    {recentAppointments.last7days.map((apt) => {
                      const fmt = formatOption(apt)
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => handleSelect(apt)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-sm dark:text-white">{fmt.display}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{fmt.subtitle}</div>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {/* No appointments at all */}
            {query.length < 2 && !hasRecentAppointments && (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                No recent appointments. Search by name, ID, or phone.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
