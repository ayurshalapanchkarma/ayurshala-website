'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  FileText, Search, Download, Pencil, Trash2, Eye,
  Home, ChevronLeft, ChevronRight, CalendarDays, User, Stethoscope,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type SummaryRow = {
  id: string
  booking_uuid: string
  booking_number: string
  patient_id: string
  patient_name: string
  doctor_name: string
  diagnosis: string
  doa_date: string | null
  dod_date: string | null
  created_at: string
  updated_at: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DischargeSummariesPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [summaries, setSummaries] = useState<SummaryRow[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  // Filters
  const [search, setSearch]       = useState('')
  const [doctor, setDoctor]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [page, setPage]           = useState(1)
  const PAGE_SIZE = 25

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const loadSummaries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:      String(page),
        page_size: String(PAGE_SIZE),
      })
      if (search)   params.set('search',    search)
      if (doctor)   params.set('doctor',    doctor)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to',   dateTo)

      const res = await fetch(`/api/admin/discharge-summaries?${params}`)
      if (!res.ok) throw new Error('Failed to load discharge summaries')
      const json = await res.json()
      setSummaries(json.summaries ?? [])
      setTotal(json.total ?? 0)
    } catch (e) {
      console.error('[DischargeSummaries] Load error:', e)
    } finally {
      setLoading(false)
    }
  }, [search, doctor, dateFrom, dateTo, page])

  useEffect(() => {
    loadSummaries()
  }, [loadSummaries])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, doctor, dateFrom, dateTo])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleDownloadPDF(row: SummaryRow) {
    setDownloading(row.id)
    try {
      // Use the new Puppeteer-based renderer (v2)
      // Pass booking_uuid to load from database
      const pdfRes = await fetch('/api/admin/discharge-summary-pdf-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_uuid: row.booking_uuid }),
      })
      if (!pdfRes.ok) {
        const err = await pdfRes.json()
        throw new Error(err.error || 'PDF generation failed')
      }
      const blob = await pdfRes.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Discharge_Summary_${row.patient_id || row.patient_name || row.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      alert(`Failed to download PDF: ${message}`)
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(row: SummaryRow) {
    const confirmed = window.confirm(
      `Delete discharge summary for ${row.patient_name} (${row.booking_number})?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(row.id)
    try {
      const res = await fetch('/api/admin/discharge-summaries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Delete failed')
      }
      await loadSummaries()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      alert(`Failed to delete: ${message}`)
    } finally {
      setDeleting(null)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function fmt(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ── Card style helpers ────────────────────────────────────────────────────

  const card = isDark
    ? 'bg-slate-900/60 border-slate-700/50'
    : 'bg-white/70 border-white/40'

  const inputCls = isDark
    ? 'bg-slate-800/50 border-slate-700 text-gray-200 placeholder-gray-500'
    : 'bg-white/50 border-stone-200 text-stone-900 placeholder-stone-400'

  const th = isDark ? 'text-gray-300' : 'text-stone-700'
  const td = isDark ? 'text-gray-200' : 'text-stone-900'
  const row_hover = isDark ? 'hover:bg-slate-800/30' : 'hover:bg-white/40'
  const divider = isDark ? 'divide-slate-700/30' : 'divide-white/20'
  const thead = isDark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-white/30 border-white/20'

  // ── Render ────────────────────────────────────────────────────────────────

  if (!mounted) return null

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-serif mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Discharge Summaries
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>
              Medical records archive — search, edit, and download all discharge summaries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/appointments"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg transition text-sm">
              <FileText className="w-4 h-4" />
              New from Appointment
            </Link>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className={`rounded-2xl backdrop-blur-2xl border p-4 mb-6 flex items-center gap-6 ${card}`}>
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
              {total} discharge {total === 1 ? 'summary' : 'summaries'} found
            </span>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className={`rounded-2xl backdrop-blur-2xl border p-6 mb-6 ${card}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-stone-400'}`} />
              <input
                type="text"
                placeholder="Patient ID, name, booking no, doctor, diagnosis…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition ${inputCls}`}
              />
            </div>

            {/* Doctor */}
            <div className="relative">
              <Stethoscope className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-stone-400'}`} />
              <input
                type="text"
                placeholder="Doctor"
                value={doctor}
                onChange={e => setDoctor(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition ${inputCls}`}
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <CalendarDays className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-stone-400'}`} />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition ${inputCls}`}
                title="From date"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <CalendarDays className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-stone-400'}`} />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition ${inputCls}`}
                title="To date"
              />
            </div>
          </div>

          {/* Clear filters + Back */}
          <div className="flex items-center justify-between mt-4">
            {(search || doctor || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(''); setDoctor(''); setDateFrom(''); setDateTo('') }}
                className={`text-sm underline ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-stone-500 hover:text-stone-800'}`}>
                Clear filters
              </button>
            )}
            <Link href="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ml-auto transition ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700'
                  : 'bg-white/50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}>
              <Home className="w-4 h-4" />
              Back to Admin
            </Link>
          </div>
        </div>

        {/* ── Table ── */}
        <div className={`rounded-2xl backdrop-blur-2xl border overflow-hidden ${card}`}>
          {loading ? (
            <div className="p-12 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-stone-500'}>Loading…</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={`mx-auto w-12 h-12 mb-4 opacity-30 ${isDark ? 'text-gray-400' : 'text-stone-500'}`} />
              <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>No discharge summaries found</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-stone-500'}`}>
                Create one from the Appointments page
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`border-b ${thead}`}>
                  <tr>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Patient ID</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Patient Name</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Booking No</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Diagnosis</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Doctor</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>DOA</th>
                    <th className={`px-5 py-3 text-left font-semibold ${th}`}>Updated</th>
                    <th className={`px-5 py-3 text-center font-semibold ${th}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {summaries.map(row => (
                    <tr key={row.id} className={`transition ${row_hover}`}>

                      {/* Patient ID */}
                      <td className={`px-5 py-3 font-mono text-xs font-semibold ${
                        isDark ? 'text-cyan-400' : 'text-cyan-700'
                      }`}>
                        {row.patient_id}
                      </td>

                      {/* Patient Name */}
                      <td className={`px-5 py-3 font-medium ${td}`}>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          {row.patient_name}
                        </div>
                      </td>

                      {/* Booking Number */}
                      <td className={`px-5 py-3 font-mono text-xs ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>
                        {row.booking_number}
                      </td>

                      {/* Diagnosis */}
                      <td className={`px-5 py-3 max-w-[200px] ${td}`}>
                        <span className="line-clamp-2 text-xs leading-snug">
                          {row.diagnosis}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className={`px-5 py-3 text-xs ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                        {row.doctor_name}
                      </td>

                      {/* DOA */}
                      <td className={`px-5 py-3 text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                        {fmt(row.doa_date)}
                      </td>

                      {/* Updated */}
                      <td className={`px-5 py-3 text-xs whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-stone-500'}`}>
                        {fmt(row.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">

                          {/* Edit */}
                          <button
                            onClick={() => router.push(`/admin/discharge-summary?booking_uuid=${encodeURIComponent(row.booking_uuid)}`)}
                            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                            title="Edit discharge summary">
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPDF(row)}
                            disabled={downloading === row.id}
                            className={`p-2 rounded-lg transition disabled:opacity-40 ${isDark ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'}`}
                            title="Download PDF">
                            {downloading === row.id
                              ? <span className="w-4 h-4 block border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : <Download className="w-4 h-4" />
                            }
                          </button>

                          {/* View Booking */}
                          <button
                            onClick={() => router.push(`/admin/appointments`)}
                            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-stone-100 text-stone-500'}`}
                            title="View booking in Appointments">
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deleting === row.id}
                            className={`p-2 rounded-lg transition disabled:opacity-40 ${isDark ? 'hover:bg-red-950/40 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                            title="Delete discharge summary">
                            {deleting === row.id
                              ? <span className="w-4 h-4 block border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && total > PAGE_SIZE && (
            <div className={`flex items-center justify-between px-5 py-3 border-t text-sm ${
              isDark ? 'border-slate-700/30 text-gray-400' : 'border-white/20 text-stone-500'
            }`}>
              <span>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded transition disabled:opacity-30 ${
                    isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                  }`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded transition disabled:opacity-30 ${
                    isDark ? 'hover:bg-slate-700' : 'hover:bg-stone-100'
                  }`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
