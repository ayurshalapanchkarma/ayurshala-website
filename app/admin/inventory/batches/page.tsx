'use client'

import { useState, useEffect } from 'react'
import { Search, AlertCircle, CheckCircle, PackageSearch} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface ProductBatch {
  uuid: string
  batch_number: string
  product_uuid: string
  expiry_date?: string
  available_quantity: number
  status: 'good' | 'quarantine' | 'expired' | 'damaged'
  is_expired?: boolean
  is_expiring_soon?: boolean
  days_to_expiry?: number
  product?: { product_name: string }
  supplier?: { company_name: string }
}

interface ListResponse {
  data: ProductBatch[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const statusColors = {
  good: 'bg-green-100 text-green-800',
  quarantine: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  damaged: 'bg-red-100 text-red-800',
}

export default function BatchManagementPage() {
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [expiringSoon, setExpiringSoon] = useState(false)

  const pageSize = 50

  useEffect(() => {
    fetchBatches()
  }, [page, search, status, expiringSoon])

  async function fetchBatches() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
        expiring_soon: String(expiringSoon),
      })

      const response = await fetch(`/api/inventory/batches?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setBatches(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={PackageSearch}
        iconColor="text-pink-600 dark:text-pink-400"
        bgColor="bg-pink-100 dark:bg-pink-950/40"
        title="Batch Management"
        subtitle="Manage product batches"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search batch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="good">Good</option>
            <option value="quarantine">Quarantine</option>
            <option value="expired">Expired</option>
            <option value="damaged">Damaged</option>
          </select>

          <label className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg cursor-pointer dark:bg-gray-700">
            <input
              type="checkbox"
              checked={expiringSoon}
              onChange={(e) => {
                setExpiringSoon(e.target.checked)
                setPage(1)
              }}
            />
            <span className="text-gray-900 dark:text-white">Expiring Soon (90 days)</span>
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
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Supplier
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Available Qty
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No batches found
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {batch.batch_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {batch.product?.product_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {batch.supplier?.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                      {batch.available_quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {batch.expiry_date ? (
                        <div className="flex items-center gap-2">
                          {batch.is_expired ? (
                            <AlertCircle className="text-red-500" size={16} />
                          ) : batch.is_expiring_soon ? (
                            <AlertCircle className="text-yellow-500" size={16} />
                          ) : (
                            <CheckCircle className="text-green-500" size={16} />
                          )}
                          {new Date(batch.expiry_date).toLocaleDateString()}
                          {batch.days_to_expiry !== undefined && (
                            <span className="text-gray-500">
                              ({batch.days_to_expiry} days)
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full ${statusColors[batch.status]}`}>
                        {batch.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
