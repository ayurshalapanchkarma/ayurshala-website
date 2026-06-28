'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Activity } from 'lucide-react'
import { ProductService } from '@/lib/inventory'

interface Transaction {
  id: string
  product_id: string
  batch_id?: string
  movement_type?: string
  transaction_type?: string
  quantity_in?: number
  quantity_out?: number
  reference_number?: string
  reference_type?: string
  remarks?: string
  created_by?: string
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: 'bg-green-100 text-green-700',
  SALE: 'bg-blue-100 text-blue-700',
  TREATMENT_CONSUMPTION: 'bg-purple-100 text-purple-700',
  RETURN_FROM_PATIENT: 'bg-orange-100 text-orange-700',
  PURCHASE_RETURN: 'bg-red-100 text-red-700',
  STOCK_ADJUSTMENT: 'bg-yellow-100 text-yellow-700',
  EXPIRED: 'bg-red-100 text-red-700',
  DAMAGED: 'bg-red-100 text-red-700',
  OPENING_STOCK: 'bg-teal-100 text-teal-700',
}

export default function TransactionsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    ProductService.getProducts().then(p => setProducts(p)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    if (!selectedProduct) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/inventory/stock/transactions?product_id=${selectedProduct}&limit=500`)
      if (!res.ok) throw new Error('Failed to load transactions')
      const data = await res.json()
      setTransactions(data.data || data || [])
      setPage(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [selectedProduct])

  useEffect(() => { load() }, [load])

  const allTypes = [...new Set(transactions.map(t => t.movement_type || t.transaction_type || '').filter(Boolean))]

  const filtered = transactions.filter(t => {
    const type = t.movement_type || t.transaction_type || ''
    const matchSearch = !search || type.toLowerCase().includes(search.toLowerCase()) ||
      (t.reference_number || '').toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || type === filterType
    return matchSearch && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function exportCSV() {
    const rows = [['Date', 'Type', 'In', 'Out', 'Reference', 'Remarks']]
    filtered.forEach(t => rows.push([
      new Date(t.created_at).toLocaleDateString(),
      t.movement_type || t.transaction_type || '-',
      String(t.quantity_in ?? 0),
      String(t.quantity_out ?? 0),
      t.reference_number || '-',
      t.remarks || '-',
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `transactions-${selectedProduct}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Transactions</h1>
        {selectedProduct && (
          <div className="flex gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">-- Select Product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
            >
              <option value="">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700">
              <Search size={16} className="text-gray-400" />
              <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Reference or type..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>
        </div>
      </div>

      {!selectedProduct ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <Activity size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Select a product to view its transaction history</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-6 py-3 text-right font-semibold text-green-700">In</th>
                  <th className="px-6 py-3 text-right font-semibold text-red-700">Out</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Reference</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {paginated.map(txn => {
                  const type = txn.movement_type || txn.transaction_type || ''
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{new Date(txn.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'}`}>
                          {type || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-green-600">{(txn.quantity_in ?? 0) > 0 ? `+${txn.quantity_in}` : '-'}</td>
                      <td className="px-6 py-3 text-right font-semibold text-red-600">{(txn.quantity_out ?? 0) > 0 ? `-${txn.quantity_out}` : '-'}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{txn.reference_number || '-'}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400 text-xs">{txn.remarks || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">{filtered.length} total transactions</p>
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
