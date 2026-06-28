'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { AdminGuard } from '@/components/AdminGuard'
import { AdminBackButton } from '@/components/AdminBackButton'
import { LogOut, Moon, Sun, Plus, Search, Filter, Download, Clock, CheckCircle, FileText } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export default function DischargeSummaryPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'drafts' | 'completed'>('drafts')
  const { theme, setTheme } = useTheme()
  const dark = mounted && theme === 'dark'

  useEffect(() => setMounted(true), [])

  return (
    <AdminGuard>
      <div className={`min-h-screen ${dark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-40 border-b ${dark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-gray-200'} backdrop-blur`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div>
              <h1 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Discharge Summary</h1>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Patient discharge records and documentation</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`p-2 rounded-lg transition ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-gray-100 hover:bg-gray-200 text-slate-600'}`}>
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link href="/admin" className={`p-2 rounded-lg transition ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-gray-100 hover:bg-gray-200 text-slate-600'}`}>
                ←
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <AdminBackButton dark={dark} />

          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Discharge Summaries</h2>
              <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Create and manage patient discharge records</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Summary
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-800">
            {['drafts', 'completed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-3 border-b-2 transition text-sm font-medium ${
                  activeTab === tab
                    ? `border-orange-600 text-orange-600 ${dark ? 'text-orange-400 border-orange-400' : ''}`
                    : `border-transparent ${dark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`
                }`}
              >
                {tab === 'drafts' ? 'Drafts' : 'Completed'}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition ${dark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            <button className={`p-2 rounded-lg transition ${dark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Filter className="w-4 h-4" />
            </button>
            <button className={`p-2 rounded-lg transition ${dark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Content - Empty State */}
          <div className={`rounded-lg border p-12 text-center ${dark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <h3 className={`text-lg font-medium mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>No discharge summaries yet</h3>
            <p className={`text-sm mb-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Create your first discharge summary to get started</p>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Summary
            </button>
          </div>

          {/* Recent Summaries Placeholder */}
          <div className="mt-8">
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Recent Activity</h3>
            <div className={`rounded-lg border p-6 text-center ${dark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>No recent activity</p>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
