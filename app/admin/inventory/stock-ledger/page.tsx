'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Download,
  Loader,
  AlertCircle, BookOpen} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'

interface LedgerItem {
  date: string
  voucher_type?: string
  reference?: string
  transaction_type: string
  batch_number?: string
  opening_qty: number
  qty_in: number
  qty_out: number
  closing_qty: number
  unit_cost: number
  running_value: number
  user: string
}

interface LedgerResponse {
  product_code: string
  product_name: string
  unit_name: string
  from_date: string
  to_date: string
  opening_stock: number
  stock_in: number
  stock_out: number
  closing_stock: number
  current_value: number
  ledger: LedgerItem[]
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
}

interface Batch {
  uuid: string
  batch_code: string
  batch_number: string
}

export default function StockLedgerPage() {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [ledgerData, setLedgerData] = useState<LedgerResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [exporting, setExporting] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dateError, setDateError] = useState<string>('')

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const response = await fetch('/api/inventory/products?pageSize=100')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load products')
    }
  }

  async function fetchBatches(productUuid: string) {
    try {
      const response = await fetch(`/api/inventory/products/${productUuid}/batches`)
      if (!response.ok) throw new Error('Failed to fetch batches')
      const data = await response.json()
      setBatches(data.data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load batches')
    }
  }

  async function generateLedger() {
    // Validate
    if (!selectedProduct) {
      toast.error('Please select a product')
      return
    }

    if (dateFrom && dateTo) {
      if (dateFrom > dateTo) {
        setDateError('From Date cannot be later than To Date')
        return
      }
    }

    setDateError('')

    try {
      setLoading(true)
      setPage(1)

      const params = new URLSearchParams({
        product_uuid: selectedProduct,
        batch_uuid: selectedBatch,
        dateFrom,
        dateTo,
        page: '1',
        pageSize: String(pageSize),
      })

      const response = await fetch(`/api/inventory/stock-ledger?${params}`)
      if (!response.ok) throw new Error('Failed to fetch ledger')

      const data = await response.json()
      setLedgerData(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to generate ledger')
    } finally {
      setLoading(false)
    }
  }

  async function handleProductChange(productUuid: string) {
    setSelectedProduct(productUuid)
    setSelectedBatch('')
    setBatches([])
    setLedgerData(null)

    if (productUuid) {
      await fetchBatches(productUuid)
    }
  }

  async function exportLedger(format: 'csv' | 'excel' = 'csv') {
    if (!ledgerData) {
      toast.error('No ledger data to export')
      return
    }

    try {
      setExporting(true)

      if (format === 'csv') {
        const headers = [
          'Date',
          'Voucher',
          'Reference',
          'Transaction Type',
          'Batch',
          'Opening Qty',
          'Qty In',
          'Qty Out',
          'Closing Qty',
          'Unit Cost',
          'Running Value',
          'User',
        ]

        const rows = ledgerData.ledger.map((item) => [
          item.date,
          item.voucher_type || '',
          item.reference || '',
          item.transaction_type,
          item.batch_number || '',
          item.opening_qty,
          item.qty_in,
          item.qty_out,
          item.closing_qty,
          item.unit_cost,
          item.running_value,
          item.user,
        ])

        const csv = [headers, ...rows]
          .map((row) => row.map((cell) => `"${cell}"`).join(','))
          .join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ledger-${ledgerData.product_code}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('Exported as CSV')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <InventoryPageHeader
        icon={BookOpen}
        iconColor="text-cyan-600 dark:text-cyan-400"
        bgColor="bg-cyan-100 dark:bg-cyan-950/40"
        title="Stock Ledger"
        subtitle="Stock transaction history"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product *
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          {batches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.uuid} value={b.uuid}>
                    {b.batch_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setDateError('')
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setDateError('')
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex flex-col items-stretch justify-end">
            <button
              onClick={generateLedger}
              disabled={!selectedProduct || loading || !!dateError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading && <Loader size={18} className="animate-spin" />}
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Date Validation Error */}
        {dateError && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {dateError}
          </div>
        )}

        {/* Export Button - Aligned with Generate */}
        {ledgerData && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => exportLedger('csv')}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {exporting && <Loader size={18} className="animate-spin" />}
              <Download size={18} />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {ledgerData && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Product</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                  {ledgerData.product_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ledgerData.product_code}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Opening Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {ledgerData.opening_stock.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{ledgerData.unit_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Stock In</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {ledgerData.stock_in.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Stock Out</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {ledgerData.stock_out.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Closing Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {ledgerData.closing_stock.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Voucher
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Transaction
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Opening Qty
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Qty In
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Qty Out
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Closing Qty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {ledgerData.ledger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle size={20} />
                          No ledger entries found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledger.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.date}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.voucher_type || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {item.transaction_type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.batch_number || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                          {item.opening_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                          {item.qty_in > 0 ? item.qty_in.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                          {item.qty_out > 0 ? item.qty_out.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                          {item.closing_qty.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {item.user}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-4">
                <InventoryPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!ledgerData && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 dark:text-gray-400">
            Select a product and click "Generate" to view the stock ledger
          </p>
        </div>
      )}
    </div>
  )
}
