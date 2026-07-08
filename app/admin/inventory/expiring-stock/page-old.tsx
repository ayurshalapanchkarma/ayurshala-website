'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Clock } from 'lucide-react'

interface ExpiringBatch {
  id: string
  batchNumber: string
  productId: string
  productName: string
  expDate: string
  currentQuantity: number
  daysUntilExpiry: number
  category: 'EXPIRED' | 'EXPIRING_7' | 'EXPIRING_30' | 'EXPIRING_60' | 'EXPIRING_90'
}

const CATEGORY_CONFIG = {
  EXPIRED:      { label: 'Expired',           color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',     border: 'border-red-300' },
  EXPIRING_7:   { label: 'Expires in 7 days', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',      border: 'border-red-200' },
  EXPIRING_30:  { label: 'Expires in 30 days', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', border: 'border-orange-300' },
  EXPIRING_60:  { label: 'Expires in 60 days', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', border: 'border-yellow-300' },
  EXPIRING_90:  { label: 'Expires in 90 days', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', border: 'border-blue-200' },
}

export default function ExpiringStockPage() {
  const [batches, setBatches] = useState<ExpiringBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/inventory/reports?type=expiry')
      if (!res.ok) throw new Error('Failed to load expiry data')
      const json = await res.json()
      // Map db view format to our ExpiringBatch interface
      const raw = json.data || []
      const mapped: ExpiringBatch[] = raw.map((r: any) => ({
        id: r.id || r.batch_id,
        batchNumber: r.batch_number,
        productId: r.product_id,
        productName: r.product_name,
        expDate: r.exp_date,
        currentQuantity: r.current_quantity ?? r.quantity,
        daysUntilExpiry: r.days_until_expiry ?? r.days_to_expiry,
        category: r.category || r.expiry_category,
      }))
      setBatches(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = batches.filter(b => {
    const matchSearch = !search || b.productName?.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNumber?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || b.category === filterCategory
    return matchSearch && matchCat
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const counts = Object.fromEntries(
    Object.keys(CATEGORY_CONFIG).map(k => [k, batches.filter(b => b.category === k).length])
  )

  function exportCSV() {
    const rows = [['Product', 'Batch', 'Exp Date', 'Days Left', 'Quantity', 'Status']]
    filtered.forEach(b => rows.push([b.productName, b.batchNumber, b.expDate, String(b.daysUntilExpiry), String(b.currentQuantity), CATEGORY_CONFIG[b.category]?.label || b.category]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `expiring-stock-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Expiring Stock</h1>
          <p className="text-sm text-gray-500 mt-1">Batches expiring within 90 days and expired</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {(Object.entries(CATEGORY_CONFIG) as [string, typeof CATEGORY_CONFIG[keyof typeof CATEGORY_CONFIG]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setFilterCategory(filterCategory === key ? '' : key); setPage(1) }}
            className={`bg-white dark:bg-slate-800 rounded-lg border-2 p-4 text-center cursor-pointer hover:shadow-md transition ${filterCategory === key ? cfg.border : 'border-gray-200 dark:border-slate-700'}`}
          >
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts[key] || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
          </button>
        ))}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search product or batch number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Checking expiry dates...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <Clock size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No expiring batches found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Batch No.</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Expiry Date</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Days Left</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(batch => {
                  const cfg = CATEGORY_CONFIG[batch.category] || CATEGORY_CONFIG.EXPIRING_90
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{batch.productName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-400">{batch.batchNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(batch.expDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={batch.daysUntilExpiry < 0 ? 'text-red-600' : batch.daysUntilExpiry <= 7 ? 'text-red-500' : batch.daysUntilExpiry <= 30 ? 'text-orange-500' : 'text-yellow-600'}>
                          {batch.daysUntilExpiry < 0 ? `${Math.abs(batch.daysUntilExpiry)}d ago` : `${batch.daysUntilExpiry}d`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{batch.currentQuantity}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} batches</p>
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
