'use client'
import { useState, useEffect } from 'react'
import { Search, Download, AlertTriangle, Clock} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface ExpiryItem {
  uuid: string
  product_code: string
  product_name: string
  batch_number: string
  quantity: number
  exp_date: string
  days_until_expiry: number
}

interface ListResponse {
  data: ExpiryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function ExpiryReportPage() {
  const [items, setItems] = useState<ExpiryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), pageSize: '50', search })
        const response = await fetch(`/api/inventory/reports/expiry?${params}`)
        if (!response.ok) throw new Error('Failed')
        const data: ListResponse = await response.json()
        setItems(data.data)
        setTotalPages(data.totalPages)
      } catch {
        toast.error('Failed to fetch expiry report')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, search])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={Clock}
        iconColor="text-orange-600 dark:text-orange-400"
        bgColor="bg-orange-100 dark:bg-orange-950/40"
        title="Expiry Report"
        subtitle="Monitor batches expiring soon"
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Batch #</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Expiry Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Days Left</th>
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
                    No expiring batches found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isExpired = item.days_until_expiry < 0
                  const isExpiringSoon = item.days_until_expiry <= 30
                  return (
                    <tr
                      key={item.uuid}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isExpired ? 'bg-red-50 dark:bg-red-900/20' : isExpiringSoon ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {item.batch_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(item.exp_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : isExpiringSoon
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {isExpired && <AlertTriangle size={14} />}
                          {Math.abs(item.days_until_expiry)} {isExpired ? 'days ago' : 'days'}
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
