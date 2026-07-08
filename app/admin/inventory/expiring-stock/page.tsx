'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  RefreshCw,
  Download,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Lock,
  Trash,
  PrinterIcon,
  TrendingUp,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import ProductPreviewModal from '@/components/inventory/ProductPreviewModal'
import EditProductModal from '@/components/inventory/EditProductModal'
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog'
import { useProductActions } from '@/lib/hooks/useProductActions'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

interface ExpiringBatchItem {
  batchUuid: string
  productUuid: string
  productCode: string
  productName: string
  sku: string | null
  categoryName: string
  batchNumber: string
  warehouseName: string | null
  supplierName: string | null
  manufacturingDate: string | null
  expiryDate: string
  daysRemaining: number
  currentQuantity: number
  unitCost: number
  totalValue: number
  unit: string
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK'
}

interface ApiResponse {
  data: ExpiringBatchItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    expired: number
    expires7Days: number
    expires30Days: number
    expires90Days: number
    inventoryValue: number
  }
  error?: string
}

const statusConfig = {
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', badge: 'bg-red-50 text-red-600' },
  CRITICAL: { label: 'Expires in 7 days', color: 'bg-red-50 text-red-600 border-red-100', badge: 'bg-red-50 text-red-600' },
  WARNING: { label: 'Expires in 30 days', color: 'bg-orange-100 text-orange-700 border-orange-200', badge: 'bg-orange-50 text-orange-600' },
  OK: { label: 'Expires in 90 days', color: 'bg-blue-50 text-blue-600 border-blue-100', badge: 'bg-blue-50 text-blue-600' },
}

export default function ExpiringStockPage() {
  const [batches, setBatches] = useState<ExpiringBatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'days_to_expiry' | 'expiry_date' | 'product_name'>('days_to_expiry')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [summary, setSummary] = useState<any>(null)
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set())
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)

  // Edit Modal
  const [editOpen, setEditOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<string | null>(null)

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [deleteProductName, setDeleteProductName] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { loading: actionLoading, handleDeleteProduct } = useProductActions({
    onSuccess: () => {
      setDeleteOpen(false)
      setDeleteProductId(null)
      loadRef.current()
    },
    onError: (err) => {
      console.error('[ExpiringStockPage] Delete error:', err)
      setDeleteError(err)
    },
  })

  const loadRef = useRef<() => void>(() => {})

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...(statusFilter && { status: statusFilter }),
        sortBy,
        sortOrder,
      })

      const res = await fetch(`/api/inventory/expiring-stock?${params}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`)
      }

      const data: ApiResponse = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setBatches(data.data || [])
      setSummary(data.summary)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to load expiring stock data'
      setError(errorMsg)
      console.error('Expiring stock API error:', e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, sortBy, sortOrder])

  loadRef.current = load

  const handlePreviewClick = (productUuid: string) => {
    console.log(`[ExpiringStockPage] Opening preview for product: ${productUuid}`)
    setPreviewProductId(productUuid)
    setPreviewOpen(true)
  }

  const handleEditClick = (productUuid: string) => {
    console.log(`[ExpiringStockPage] Opening edit modal for product: ${productUuid}`)
    setEditProductId(productUuid)
    setEditOpen(true)
  }

  const handleDeleteClick = (productUuid: string, productName: string) => {
    console.log(`[ExpiringStockPage] Opening delete dialog for product: ${productUuid}`)
    setDeleteProductId(productUuid)
    setDeleteProductName(productName)
    setDeleteError(null)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteProductId) return

    try {
      console.log(`[ExpiringStockPage] Confirming delete for: ${deleteProductId}`)
      await handleDeleteProduct(deleteProductId)
    } catch (err) {
      console.error(`[ExpiringStockPage] Delete failed:`, err)
    }
  }

  useEffect(() => {
    load()
  }, [load])

  const handleSelectAll = () => {
    if (selectedBatches.size === batches.length) {
      setSelectedBatches(new Set())
    } else {
      setSelectedBatches(new Set(batches.map(b => b.batchUuid)))
    }
  }

  const handleSelectBatch = (uuid: string) => {
    const newSelected = new Set(selectedBatches)
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid)
    } else {
      newSelected.add(uuid)
    }
    setSelectedBatches(newSelected)
  }

  const handleExportCSV = () => {
    const selectedData = batches.filter(b => selectedBatches.has(b.batchUuid))
    const dataToExport = selectedData.length > 0 ? selectedData : batches

    const rows = [
      ['Product', 'SKU', 'Batch Number', 'Warehouse', 'Supplier', 'Manufacturing Date', 'Expiry Date', 'Days Remaining', 'Quantity', 'Unit Cost', 'Total Value', 'Status'],
    ]
    dataToExport.forEach(b =>
      rows.push([
        b.productName,
        b.sku || '',
        b.batchNumber,
        b.warehouseName || '',
        b.supplierName || '',
        b.manufacturingDate || '',
        b.expiryDate,
        String(b.daysRemaining),
        String(b.currentQuantity),
        String(b.unitCost),
        String(b.totalValue.toFixed(2)),
        b.status,
      ])
    )

    const csv = rows.map(r => r.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `expiring-stock-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const totalPages = summary ? Math.ceil(summary.expired + summary.expires7Days + summary.expires30Days + summary.expires90Days) / pageSize : 1

  // Chart data
  const statusDistribution = summary
    ? [
        { name: 'Expired', value: summary.expired, fill: '#dc2626' },
        { name: '0-7 Days', value: summary.expires7Days, fill: '#ea580c' },
        { name: '8-30 Days', value: summary.expires30Days, fill: '#f59e0b' },
        { name: '31-90 Days', value: summary.expires90Days, fill: '#3b82f6' },
      ]
    : []

  const timelineData = summary
    ? [
        { period: 'Expired', count: summary.expired },
        { period: 'This Week', count: summary.expires7Days },
        { period: 'This Month', count: summary.expires30Days },
        { period: 'Next 2 Months', count: summary.expires90Days },
      ]
    : []

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-slate-950 min-h-screen">

      <InventoryPageHeader
        icon={Clock}
        iconColor="text-yellow-600 dark:text-yellow-400"
        bgColor="bg-yellow-100 dark:bg-yellow-950/40"
        title="Expiring Stock"
        subtitle="Products near expiry"
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Expiring Stock</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor inventory batches nearing or past their expiry date</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <PrinterIcon size={16} /> Print
          </button>
          <button
            onClick={() => loadRef.current()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Already Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.expired}</p>
              </div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires in 7 Days</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{summary.expires7Days}</p>
              </div>
              <Clock className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires in 30 Days</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.expires30Days}</p>
              </div>
              <Calendar className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires in 90 Days</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{summary.expires90Days}</p>
              </div>
              <TrendingUp className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Expiring Value</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">₹{(summary.inventoryValue / 100000).toFixed(1)}L</p>
              </div>
              <DollarSign className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-gray-400"
              placeholder="Search product name or batch number..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white"
            >
              <option value="days_to_expiry">Days to Expiry</option>
              <option value="expiry_date">Expiry Date</option>
              <option value="product_name">Product Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: '', label: 'All' },
            { key: 'expired', label: 'Expired' },
            { key: 'expiring_7', label: '0-7 Days' },
            { key: 'expiring_30', label: '8-30 Days' },
            { key: 'expiring_90', label: '31-90 Days' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => {
                setStatusFilter(f.key)
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                statusFilter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 flex items-center gap-3">
          <AlertTriangle size={20} />
          <div>
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Checking expiry dates...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && batches.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <Clock size={48} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No expiring batches found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All inventory is within healthy expiry windows ✓</p>
        </div>
      )}

      {/* Charts */}
      {!loading && batches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Expiry Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} label={{ fill: '#666', fontSize: 12 }} outerRadius={100} fill="#8884d8" dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Expiry Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && batches.length > 0 && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden print:border-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedBatches.size === batches.length && batches.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Batch No.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Expiry Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Days Left</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Unit Cost</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total Value</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {batches.map(batch => {
                    const cfg = statusConfig[batch.status]
                    return (
                      <tr key={batch.batchUuid} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 print:hidden">
                          <input
                            type="checkbox"
                            checked={selectedBatches.has(batch.batchUuid)}
                            onChange={() => handleSelectBatch(batch.batchUuid)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{batch.productName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{batch.sku || batch.productCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{batch.batchNumber}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{batch.expiryDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${
                              batch.daysRemaining < 0
                                ? 'text-red-600'
                                : batch.daysRemaining <= 7
                                  ? 'text-red-500'
                                  : batch.daysRemaining <= 30
                                    ? 'text-orange-500'
                                    : 'text-yellow-600'
                            }`}
                          >
                            {batch.daysRemaining < 0 ? `${Math.abs(batch.daysRemaining)}d ago` : `${batch.daysRemaining}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {batch.currentQuantity} {batch.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{batch.unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">₹{batch.totalValue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center print:hidden">
                          <button
                            onClick={() => handlePreviewClick(batch.productUuid)}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 transition"
                            title="Preview Product"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(batch.productUuid)}
                            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(batch.productUuid, batch.productName)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 print:hidden">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {batches.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, batches.length)} of {batches.length} batches
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded disabled:opacity-50 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>

          {/* Modals */}
          <ProductPreviewModal
            productUuid={previewProductId}
            isOpen={previewOpen}
            onClose={() => {
              setPreviewOpen(false)
              setPreviewProductId(null)
            }}
            onEdit={(productId) => {
              console.log('[ExpiringStockPage] Edit product from preview:', productId)
              setPreviewOpen(false)
              setEditProductId(productId)
              setEditOpen(true)
            }}
          />

          <EditProductModal
            productUuid={editProductId}
            isOpen={editOpen}
            onClose={() => {
              setEditOpen(false)
              setEditProductId(null)
            }}
            onSuccess={() => {
              console.log('[ExpiringStockPage] Product updated, reloading list')
              loadRef.current()
            }}
          />

          <DeleteConfirmationDialog
            isOpen={deleteOpen}
            isLoading={actionLoading}
            productName={deleteProductName}
            error={deleteError}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setDeleteOpen(false)
              setDeleteProductId(null)
              setDeleteProductName('')
              setDeleteError(null)
            }}
          />
        </>
      )}
    </div>
  )
}
