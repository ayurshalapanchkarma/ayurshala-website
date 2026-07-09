'use client'
import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, TriangleAlert} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

interface LowStockItem {
  uuid: string
  product_code: string
  product_name: string
  current_quantity: number
  reorder_level: number
  unit_name: string
  variance_percent: number
}

interface ListResponse {
  data: LowStockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function LowStockReportPage() {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), pageSize: '50', search })
        const response = await fetch(`/api/inventory/reports/low-stock?${params}`)
        if (!response.ok) throw new Error('Failed')
        const data: ListResponse = await response.json()
        setItems(data.data)
        setTotalPages(data.totalPages)
      } catch {
        toast.error('Failed to fetch low stock report')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, search])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={TriangleAlert}
        iconColor="text-red-600 dark:text-red-400"
        bgColor="bg-red-100 dark:bg-red-950/40"
        title="Low Stock Report"
        subtitle="Items below reorder level"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Current Qty</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Reorder Level</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Unit</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Shortage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No low stock items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700 bg-red-50 dark:bg-red-900/20">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-red-700 dark:text-red-400">
                      {item.current_quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      {item.reorder_level}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.unit_name}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <AlertTriangle size={14} />
                        {item.variance_percent}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">Page {page} of {totalPages}</div>
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
