'use client'
import { useState, useEffect } from 'react'
import { Search, Ban} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'
import { BackButton } from '@/components/inventory/BackButton'

interface DeadStockItem {
  uuid: string
  product_code: string
  product_name: string
  current_quantity: number
  last_movement_date?: string
  days_without_movement: number
  unit_name: string
}

interface ListResponse {
  data: DeadStockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function DeadStockReportPage() {
  const [items, setItems] = useState<DeadStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), pageSize: '50', search })
        const response = await fetch(`/api/inventory/reports/dead-stock?${params}`)
        if (!response.ok) throw new Error('Failed')
        const data: ListResponse = await response.json()
        setItems(data.data)
        setTotalPages(data.totalPages)
      setTotal(data.total)
      } catch {
        toast.error('Failed to fetch dead stock report')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, search])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={Ban}
        iconColor="text-slate-600 dark:text-slate-400"
        bgColor="bg-slate-100 dark:bg-slate-950/40"
        title="Dead Stock Report"
        subtitle="Identify slow-moving or non-moving stock"
      />

      <BackButton />

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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Unit</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Last Movement</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Days Idle</th>
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
                    No dead stock items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isDeadStock = item.days_without_movement > 180
                  return (
                    <tr
                      key={item.uuid}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isDeadStock ? 'bg-gray-100 dark:bg-gray-700' : 'bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {item.current_quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.unit_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {item.last_movement_date ? new Date(item.last_movement_date).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            isDeadStock
                              ? 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {item.days_without_movement} days
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4">
          <InventoryPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
