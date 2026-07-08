'use client'

import { useState, useEffect } from 'react'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface StockItem {
  uuid: string
  product_code: string
  product_name: string
  current_quantity: number
  reorder_level: number
  unit_name: string
  warehouse_location: string
}

interface ListResponse {
  data: StockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function CurrentStockReportPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const pageSize = 50

  useEffect(() => {
    fetchData()
  }, [page, search])

  async function fetchData() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
      })

      const response = await fetch(`/api/inventory/reports/current-stock?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setItems(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch current stock report')
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    try {
      const csv = [
        ['Product Code', 'Product Name', 'Current Qty', 'Reorder Level', 'Unit', 'Location'].join(','),
        ...items.map((item) =>
          [
            item.product_code,
            item.product_name,
            item.current_quantity,
            item.reorder_level,
            item.unit_name,
            item.warehouse_location,
          ].join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `current-stock-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Current Stock Report</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View all products with current inventory levels</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Current Qty
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Reorder Level
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Location
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
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.current_quantity <= item.reorder_level
                  return (
                    <tr
                      key={item.uuid}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {item.product_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-white">
                        {item.current_quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.reorder_level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {item.unit_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {item.warehouse_location}
                      </td>
                    </tr>
                  )
                })
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
