'use client'
import { useState, useEffect } from 'react'
import { Search, Download, ChevronLeft, ChevronRight, AlertTriangle, PackageSearch} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

interface BatchItem { uuid: string; product_code: string; product_name: string; batch_number: string; quantity: number; mfg_date: string; exp_date: string }
interface ListResponse { data: BatchItem[]; total: number; page: number; pageSize: number; totalPages: number }

export default function BatchReportPage() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), pageSize: '50', search })
        const response = await fetch(`/api/inventory/reports/batch?${params}`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data: ListResponse = await response.json()
        setItems(data.data); setTotalPages(data.totalPages)
      } catch (error) {
        toast.error('Failed to fetch batch report')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, search])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={PackageSearch}
        iconColor="text-pink-600 dark:text-pink-400"
        bgColor="bg-pink-100 dark:bg-pink-950/40"
        title="Batch Report"
        subtitle="View all product batches and expiry details"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Mfg Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Exp Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                : items.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No batches found</td></tr>
                : items.map((item) => <tr key={item.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.product_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.batch_number}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{new Date(item.mfg_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{new Date(item.exp_date).toLocaleDateString()}</td>
                </tr>)
              }
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
