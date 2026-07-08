'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface CurrentStock {
  product_uuid: string
  product_code: string
  product_name: string
  category?: string
  current_stock: number
  reorder_level: number
  is_low_stock: boolean
  batches_count: number
}

interface ListResponse {
  data: CurrentStock[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function StockManagementPage() {
  const [stocks, setStocks] = useState<CurrentStock[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const pageSize = 50

  useEffect(() => {
    fetchStock()
  }, [page, search, lowStockOnly])

  async function fetchStock() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        low_stock_only: String(lowStockOnly),
      })

      const response = await fetch(`/api/inventory/stock?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setStocks(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Current Stock</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg cursor-pointer dark:bg-gray-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked)
                setPage(1)
              }}
            />
            <span className="text-gray-900 dark:text-white">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Reorder Level
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Batches
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No stock found
                  </td>
                </tr>
              ) : (
                stocks.map((stock) => (
                  <tr key={stock.product_uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {stock.product_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {stock.product_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {stock.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                      {stock.current_stock}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {stock.reorder_level}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {stock.batches_count}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {stock.is_low_stock ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle size={16} />
                          <span>Low Stock</span>
                        </div>
                      ) : (
                        <span className="text-green-600">Normal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
