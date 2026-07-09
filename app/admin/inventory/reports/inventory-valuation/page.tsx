'use client'

import { useState, useEffect } from 'react'
import { Search, Download, DollarSign} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface ValuationItem {
  uuid: string
  product_code: string
  product_name: string
  quantity: number
  unit_cost: number
  total_value: number
}

interface ListResponse {
  data: ValuationItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function InventoryValuationPage() {
  const [items, setItems] = useState<ValuationItem[]>([])
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

      const response = await fetch(`/api/inventory/reports/inventory-valuation?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setItems(data.data)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch inventory valuation')
    } finally {
      setLoading(false)
    }
  }

  const totalValue = items.reduce((sum, item) => sum + item.total_value, 0)

  function handleExport() {
    try {
      const csv = [
        ['Product Code', 'Product Name', 'Quantity', 'Unit Cost', 'Total Value'].join(','),
        ...items.map((item) =>
          [item.product_code, item.product_name, item.quantity, item.unit_cost, item.total_value].join(',')
        ),
        ['', '', '', 'TOTAL', totalValue.toFixed(2)].join(','),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <InventoryPageHeader
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          title="Inventory Valuation"
          subtitle="Calculate total inventory value and analysis"
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex-shrink-0"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

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

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{items.reduce((sum, item) => sum + item.quantity, 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Unit Cost</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            ₹{items.length > 0 ? (totalValue / items.reduce((sum, item) => sum + item.quantity, 1)).toFixed(2) : '0'}
          </p>
        </div>
      </div>

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
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Total Value
                </th>
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
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.product_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">
                      ₹{item.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ₹{item.total_value.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
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
