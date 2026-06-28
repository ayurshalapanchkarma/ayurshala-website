'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, AlertTriangle } from 'lucide-react'

interface LowStockItem {
  productId: string
  productName: string
  productSku: string
  currentStock: number
  reorderLevel: number
  shortfall: number
}

export default function LowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/inventory/reports?type=low-stock')
      if (!res.ok) throw new Error('Failed to load low stock data')
      const data = await res.json()
      setItems(data.data || data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(
    i => i.productName?.toLowerCase().includes(search.toLowerCase()) ||
         i.productSku?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function exportCSV() {
    const rows = [['Product', 'SKU', 'Current Stock', 'Reorder Level', 'Shortfall']]
    filtered.forEach(i => rows.push([i.productName, i.productSku, String(i.currentStock), String(i.reorderLevel), String(i.shortfall)]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `low-stock-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Low Stock Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Products at or below reorder level</p>
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

      {filtered.length > 0 && !loading && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-orange-600" size={20} />
          <p className="text-orange-700 dark:text-orange-400 font-medium">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} need restocking
          </p>
        </div>
      )}

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search by product or SKU..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Checking stock levels...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">All stock levels are healthy</p>
          <p className="text-sm text-gray-500 mt-1">No products are below their reorder level</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Current Stock</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Reorder Level</th>
                  <th className="px-6 py-3 text-right font-semibold text-red-700">Shortfall</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(item => (
                  <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.productSku}</td>
                    <td className="px-6 py-4 text-right font-semibold text-orange-600">{item.currentStock}</td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">{item.reorderLevel}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">{item.shortfall}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.currentStock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} items need attention</p>
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
