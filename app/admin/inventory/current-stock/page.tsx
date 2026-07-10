'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Download, Package, Boxes } from 'lucide-react'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { BackButton } from '@/components/inventory/BackButton'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface StockItem {
  product_uuid: string
  product_code: string
  product_name: string
  generic_name?: string
  category?: string
  unit_name?: string
  unit_short?: string
  current_stock: number
  reorder_level: number
  min_stock: number
  is_low_stock: boolean
  batches_count: number
}

interface StockResponse {
  data: StockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function CurrentStockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch,
      })
      const res = await fetch(`/api/inventory/stock?${params}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }
      const data: StockResponse = await res.json()
      setItems(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { load() }, [load])

  function exportCSV() {
    const rows = [['Product Code', 'Product Name', 'Category', 'Unit', 'Current Stock', 'Reorder Level', 'Batches', 'Status']]
    items.forEach(i => rows.push([
      i.product_code,
      i.product_name,
      i.category || '',
      i.unit_name || '',
      String(i.current_stock),
      String(i.reorder_level),
      String(i.batches_count),
      i.current_stock === 0 ? 'Out of Stock' : i.is_low_stock ? 'Low Stock' : 'In Stock',
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `current-stock-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const outOfStock = items.filter(i => i.current_stock === 0).length
  const lowStock = items.filter(i => i.is_low_stock && i.current_stock > 0).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">

      <BackButton />

      <InventoryPageHeader
        icon={Boxes}
        iconColor="text-green-600 dark:text-green-400"
        bgColor="bg-green-100 dark:bg-green-950/40"
        title="Current Stock"
        subtitle="Real-time stock levels"
      />

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-sm"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Products</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">In Stock</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{total - outOfStock - lowStock}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Low Stock</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{lowStock}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Out of Stock</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{outOfStock}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by product or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">Loading stock data...</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Package size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {search ? 'No products match your search' : 'No stock data available'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Code</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Category</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Reorder Lvl</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Batches</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {items.map(item => (
                  <tr key={item.product_uuid} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                      {item.product_name}
                      {item.generic_name && (
                        <span className="block text-xs text-gray-400 font-normal">{item.generic_name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{item.product_code}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{item.category || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                      {item.current_stock} <span className="text-xs font-normal text-gray-400">{item.unit_short}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500 dark:text-gray-400">{item.reorder_level}</td>
                    <td className="px-5 py-3.5 text-center text-gray-600 dark:text-gray-400">{item.batches_count}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.current_stock === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : item.is_low_stock
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {item.current_stock === 0 ? 'Out of Stock' : item.is_low_stock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InventoryPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
