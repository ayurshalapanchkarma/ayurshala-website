'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Eye,
  Download,
  Loader,
  FileText, ArrowLeftRight} from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'
import { InventoryPagination } from '@/components/inventory/InventoryPagination'
import { BackButton } from '@/components/inventory/BackButton'

interface Transaction {
  uuid: string
  created_at: string
  movement_type: string
  quantity: number
  before_stock: number
  after_stock: number
  reference_type?: string
  reference_uuid?: string
  remarks?: string
  product_code: string
  product_name: string
  batch_number?: string
  unit_name?: string
  created_by_name?: string
}

interface ListResponse {
  data: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Product {
  uuid: string
  product_code: string
  product_name: string
}

const movementTypeColors = {
  PURCHASE: 'bg-blue-600 text-white dark:bg-blue-700 dark:text-white',
  SALE: 'bg-green-600 text-white dark:bg-green-700 dark:text-white',
  RETURN: 'bg-purple-600 text-white dark:bg-purple-700 dark:text-white',
  TRANSFER: 'bg-cyan-600 text-white dark:bg-cyan-700 dark:text-white',
  ADJUSTMENT: 'bg-orange-600 text-white dark:bg-orange-700 dark:text-white',
  CONSUMPTION: 'bg-slate-600 text-white dark:bg-slate-700 dark:text-white',
  EXPIRED: 'bg-slate-600 text-white dark:bg-slate-700 dark:text-white',
  DAMAGED: 'bg-red-600 text-white dark:bg-red-700 dark:text-white',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [movement_type, setMovementType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [product_uuid, setProductUuid] = useState('')
  const [exporting, setExporting] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const pageSize = 50

  useEffect(() => {
    fetchTransactions()
  }, [page, search, movement_type, dateFrom, dateTo, product_uuid])

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchTransactions() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        movement_type,
        dateFrom,
        dateTo,
        product_uuid,
      })

      const response = await fetch(`/api/inventory/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()
      setTransactions(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setTotal(data.total)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch('/api/inventory/products?pageSize=100')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function exportCSV() {
    try {
      setExporting(true)

      // Fetch all data
      const params = new URLSearchParams({
        page: '1',
        pageSize: '999999',
        search,
        movement_type,
        dateFrom,
        dateTo,
        product_uuid,
      })

      const response = await fetch(`/api/inventory/transactions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: ListResponse = await response.json()

      // Generate CSV
      const headers = [
        'Date',
        'Product Code',
        'Product Name',
        'Batch',
        'Type',
        'Reference',
        'Qty In',
        'Qty Out',
        'Balance',
        'Unit',
        'Performed By',
        'Remarks',
      ]

      const rows = data.data.map((tx) => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.product_code,
        tx.product_name,
        tx.batch_number || '',
        tx.movement_type,
        tx.reference_type || '',
        ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN'].includes(tx.movement_type)
          ? tx.quantity
          : '',
        !['PURCHASE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN'].includes(tx.movement_type)
          ? tx.quantity
          : '',
        tx.after_stock,
        tx.unit_name,
        tx.created_by_name,
        tx.remarks || '',
      ])

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Exported successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  // Calculate stats
  const stats = {
    today: transactions.filter(
      (tx) =>
        new Date(tx.created_at).toDateString() === new Date().toDateString()
    ).length,
    stockIn: transactions
      .filter(
        (tx) =>
          ['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(tx.movement_type)
      )
      .reduce((sum, tx) => sum + tx.quantity, 0),
    stockOut: transactions
      .filter(
        (tx) =>
          !['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(tx.movement_type)
      )
      .reduce((sum, tx) => sum + tx.quantity, 0),
    total: total,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">

      <BackButton />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <InventoryPageHeader
            icon={ArrowLeftRight}
            iconColor="text-blue-500 dark:text-blue-400"
            bgColor="bg-blue-100 dark:bg-blue-950/40"
            title="Transactions"
            subtitle="All stock movements"
          />
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2 flex-shrink-0"
        >
          <FileText size={20} />
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {/* Summary Cards */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Today's Transactions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.today}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock In</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {stats.stockIn.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock Out</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
              {stats.stockOut.toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Movements</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

          <select
            value={product_uuid}
            onChange={(e) => {
              setProductUuid(e.target.value)
              setPage(1)
            }}
            className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.uuid} value={p.uuid}>
                {p.product_name}
              </option>
            ))}
          </select>

          <select
            value={movement_type}
            onChange={(e) => {
              setMovementType(e.target.value)
              setPage(1)
            }}
            className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value="">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment</option>
            <option value="CONSUMPTION">Consumption</option>
            <option value="EXPIRED">Expired</option>
            <option value="DAMAGED">Damaged</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={exporting || transactions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm"
          >
            {exporting && <Loader size={16} className="animate-spin" />}
            <Download size={16} />
            Export CSV
          </button>
        </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Batch
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Qty In
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Qty Out
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No inventory transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isInMovement = ['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(
                    tx.movement_type
                  )
                  return (
                    <tr
                      key={tx.uuid}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {tx.product_name}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tx.product_code}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {tx.batch_number || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            movementTypeColors[
                              tx.movement_type as keyof typeof movementTypeColors
                            ] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tx.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {isInMovement ? tx.quantity.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {!isInMovement ? tx.quantity.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                        {tx.after_stock.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {tx.remarks || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-4">
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
