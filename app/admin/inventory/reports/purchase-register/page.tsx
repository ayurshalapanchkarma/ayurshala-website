'use client'

import { useState, useEffect } from 'react'
import { Search, Download, ShoppingCart} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface PurchaseRecord {
  uuid: string
  po_number: string
  supplier_name: string
  order_date: string
  total_amount: number
  received_amount: number
  status: string
}

interface ListResponse {
  data: PurchaseRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function PurchaseRegisterPage() {
  const [items, setItems] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
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

      const response = await fetch(`/api/inventory/reports/purchase-register?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setItems(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch purchase register')
    } finally {
      setLoading(false)
    }
  }

  const totalPurchased = items.reduce((sum, item) => sum + item.total_amount, 0)
  const totalReceived = items.reduce((sum, item) => sum + item.received_amount, 0)

  function handleExport() {
    try {
      const csv = [
        ['PO Number', 'Supplier', 'Order Date', 'Total Amount', 'Received Amount', 'Status'].join(','),
        ...items.map((item) =>
          [
            item.po_number,
            item.supplier_name,
            new Date(item.order_date).toLocaleDateString(),
            item.total_amount,
            item.received_amount,
            item.status,
          ].join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `purchase-register-${new Date().toISOString().split('T')[0]}.csv`
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
          icon={ShoppingCart}
          iconColor="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-950/40"
          title="Purchase Register"
          subtitle="Summary of all purchase orders and GRNs"
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex-shrink-0"
        >
          <Download size={20} />
          Export
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search PO..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Ordered</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{totalPurchased.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Received</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">₹{totalReceived.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">PO Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Supplier</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Order Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Received</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No records found</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.po_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.supplier_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(item.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ₹{item.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ₹{item.received_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.status}
                      </span>
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
