'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Download, Plus } from 'lucide-react'
import { GRNService, SupplierService } from '@/lib/inventory'

interface GRN {
  id: string
  grn_number: string
  supplier_id?: string
  supplier_name?: string
  received_date: string
  received_by?: string
  status: 'DRAFT' | 'RECEIVED' | 'PARTIAL' | 'REJECTED' | 'POSTED'
  remarks?: string
}

export default function GRNPage() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    SupplierService.getSuppliers().then(s => setSuppliers(s)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await GRNService.getGRNs()
      setGrns(data as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load GRNs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = !filterStatus ? grns : grns.filter(g => g.status === filterStatus)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    RECEIVED: 'bg-green-100 text-green-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
    POSTED: 'bg-blue-100 text-blue-700',
  }

  function exportCSV() {
    const rows = [['GRN Number', 'Status', 'Received Date', 'Supplier']]
    filtered.forEach(g => rows.push([g.grn_number, g.status, new Date(g.received_date).toLocaleDateString(), g.supplier_name || '-']))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `grn-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Goods Receipt Notes</h1>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <Download size={16} /> Export
          </button>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            <Plus size={16} /> New GRN
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="RECEIVED">Received</option>
          <option value="PARTIAL">Partial</option>
          <option value="POSTED">Posted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading GRNs...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No GRNs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">GRN Number</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Received Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(grn => (
                  <tr key={grn.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-mono text-xs font-medium">{grn.grn_number}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[grn.status] || 'bg-gray-100 text-gray-700'}`}>
                        {grn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(grn.received_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{grn.supplier_name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} GRNs</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded disabled:opacity-50 text-sm">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50 text-sm">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
