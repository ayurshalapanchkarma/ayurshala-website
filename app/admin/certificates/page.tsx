'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FileCheck, BadgeCheck, FilePen, Ban, Eye, Download, CircleOff, Plus, Home, Search } from 'lucide-react'
import { useTheme } from 'next-themes'

type Certificate = {
  id: string
  certificate_no: string
  patient_uuid: string
  booking_uuid?: string
  certificate_type_id: string
  issue_date: string
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED'
  issued_by: string
  created_at: string
  patient?: { full_name: string; patient_id: string; email: string }
  certificate_type?: { name: string }
}

type StatCard = {
  label: string
  value: number
  icon: React.ComponentType<any>
  color: string
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [stats, setStats] = useState({ total: 0, issued: 0, draft: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'ISSUED' | 'CANCELLED'>('ALL')
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === 'dark'

  useEffect(() => {
    loadCertificates()
  }, [statusFilter, search])

  async function loadCertificates() {
    setLoading(true)
    let query = supabase.from('certificates').select(`
      *,
      patient:patient_uuid(full_name, patient_id, email),
      certificate_type:certificate_type_id(name)
    `).order('created_at', { ascending: false })

    if (statusFilter !== 'ALL') {
      query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (!error && data) {
      const filtered = search
        ? data.filter(c => 
            c.certificate_no.toLowerCase().includes(search.toLowerCase()) ||
            c.patient?.full_name.toLowerCase().includes(search.toLowerCase())
          )
        : data

      setCertificates(filtered)

      // Calculate stats
      setStats({
        total: data.length,
        issued: data.filter(c => c.status === 'ISSUED').length,
        draft: data.filter(c => c.status === 'DRAFT').length,
        cancelled: data.filter(c => c.status === 'CANCELLED').length,
      })
    }
    setLoading(false)
  }

  async function downloadPDF(certificateId: string) {
    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/download`)
      if (!res.ok) throw new Error('Download failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificateId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download error:', error)
    }
  }

  async function cancelCertificate(certificateId: string) {
    const confirmed = window.confirm('Are you sure you want to cancel this certificate?')
    if (!confirmed) return

    await supabase.from('certificates').update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    }).eq('id', certificateId)

    loadCertificates()
  }

  const statCards: StatCard[] = [
    { label: 'Total Certificates', value: stats.total, icon: FileCheck, color: 'from-blue-500 to-cyan-500' },
    { label: 'Issued Certificates', value: stats.issued, icon: BadgeCheck, color: 'from-green-500 to-emerald-500' },
    { label: 'Draft Certificates', value: stats.draft, icon: FilePen, color: 'from-amber-500 to-orange-500' },
    { label: 'Cancelled Certificates', value: stats.cancelled, icon: Ban, color: 'from-red-500 to-rose-500' },
  ]

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-orange-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-serif mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>Certificates</h1>
            <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>Manage and issue patient certificates</p>
          </div>
          <Link href="/admin/certificates/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg transition">
            <Plus className="w-5 h-5" />
            Issue Certificate
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label}
                className={`rounded-2xl backdrop-blur-2xl border p-6 transition ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-700/50'
                    : 'bg-white/70 border-white/40'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-stone-600'}`}>{card.label}</p>
                    <p className={`text-3xl font-bold mt-2 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg text-white opacity-20`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className={`rounded-2xl backdrop-blur-2xl border p-6 mb-6 ${
          isDark
            ? 'bg-slate-900/60 border-slate-700/50'
            : 'bg-white/70 border-white/40'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-3 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-stone-400'}`} />
              <input
                type="text"
                placeholder="Search certificate..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition ${
                  isDark
                    ? 'bg-slate-800/50 border-slate-700 text-gray-200 placeholder-gray-500'
                    : 'bg-white/50 border-stone-200 text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-4 py-2 rounded-lg border transition ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700 text-gray-200'
                  : 'bg-white/50 border-stone-200 text-stone-900'
              }`}>
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Link href="/admin"
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700'
                  : 'bg-white/50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}>
              <Home className="w-5 h-5" />
              Back
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl backdrop-blur-2xl border overflow-hidden ${
          isDark
            ? 'bg-slate-900/60 border-slate-700/50'
            : 'bg-white/70 border-white/40'
        }`}>
          {loading ? (
            <div className="p-8 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>Loading...</p>
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-8 text-center">
              <p className={isDark ? 'text-gray-400' : 'text-stone-600'}>No certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`border-b ${isDark ? 'border-slate-700/30 bg-slate-800/30' : 'border-white/20 bg-white/30'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Certificate No
                    </th>
                    <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Patient
                    </th>
                    <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Type
                    </th>
                    <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Issue Date
                    </th>
                    <th className={`px-6 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-center font-semibold ${isDark ? 'text-gray-300' : 'text-stone-700'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700/30' : 'divide-white/20'}`}>
                  {certificates.map((cert) => (
                    <tr key={cert.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-white/40'}>
                      <td className={`px-6 py-3 font-mono font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        {cert.certificate_no}
                      </td>
                      <td className={`px-6 py-3 ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                        {cert.patient?.full_name}
                      </td>
                      <td className={`px-6 py-3 ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                        {cert.certificate_type?.name}
                      </td>
                      <td className={`px-6 py-3 ${isDark ? 'text-gray-200' : 'text-stone-900'}`}>
                        {new Date(cert.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          cert.status === 'ISSUED' ? 'bg-green-100/60 text-green-800 dark:bg-green-950/50 dark:text-green-200' :
                          cert.status === 'DRAFT' ? 'bg-amber-100/60 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' :
                          'bg-red-100/60 text-red-800 dark:bg-red-950/50 dark:text-red-200'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/certificates/${cert.id}`)}
                            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white/50'}`}
                            title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {cert.status === 'ISSUED' && (
                            <button
                              onClick={() => downloadPDF(cert.id)}
                              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white/50'}`}
                              title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {cert.status !== 'CANCELLED' && (
                            <button
                              onClick={() => cancelCertificate(cert.id)}
                              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white/50'}`}
                              title="Cancel">
                              <CircleOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
