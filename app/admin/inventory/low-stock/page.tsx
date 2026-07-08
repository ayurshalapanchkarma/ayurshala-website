'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import ProductPreviewModal from '@/components/inventory/ProductPreviewModal'
import EditProductModal from '@/components/inventory/EditProductModal'
import DeleteConfirmationDialog from '@/components/inventory/DeleteConfirmationDialog'
import InventoryBackButton from '@/components/inventory/InventoryBackButton'
import { useProductActions } from '@/lib/hooks/useProductActions'

interface LowStockItem {
  productUuid: string
  productCode: string
  productName: string
  sku: string | null
  categoryName: string
  warehouseName: string | null
  currentQty: number
  minimumStock: number
  reorderLevel: number
  difference: number
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'BELOW_REORDER'
  unit: string
  lastMovement: string | null
  supplierName: string | null
  purchasePrice: number
  valueAtRisk: number
}

interface ApiResponse {
  data: LowStockItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalProducts: number
    outOfStock: number
    critical: number
    belowReorder: number
    inventoryValueAtRisk: number
  }
  error?: string
}

const statusConfig = {
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', badge: 'bg-red-50 text-red-600' },
  CRITICAL: { label: 'Critical', color: 'bg-orange-100 text-orange-700 border-orange-200', badge: 'bg-orange-50 text-orange-600' },
  BELOW_REORDER: { label: 'Below Reorder', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', badge: 'bg-yellow-50 text-yellow-600' },
}

export default function LowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<'shortfall' | 'current_qty' | 'reorder_level'>('shortfall')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [summary, setSummary] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

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
      console.error('[LowStockPage] Delete error:', err)
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
        sortBy,
        sortOrder,
      })

      console.log(`[LowStockPage] Loading with params:`, params.toString())
      const res = await fetch(`/api/inventory/low-stock?${params}`)
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`)
      }

      const data: ApiResponse = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log(`[LowStockPage] Loaded ${data.data.length} items`)
      setItems(data.data || [])
      setSummary(data.summary)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to load low stock data'
      setError(errorMsg)
      console.error('[LowStockPage] Load error:', e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, sortBy, sortOrder])

  loadRef.current = load

  useEffect(() => {
    load()
  }, [load])

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(i => i.productUuid)))
    }
  }

  const handleSelectItem = (uuid: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid)
    } else {
      newSelected.add(uuid)
    }
    setSelectedItems(newSelected)
  }

  const handlePreviewClick = (productUuid: string) => {
    console.log(`[LowStockPage] Opening preview for product: ${productUuid}`)
    setPreviewProductId(productUuid)
    setPreviewOpen(true)
  }

  const handleEditClick = (productUuid: string) => {
    console.log(`[LowStockPage] Opening edit modal for product: ${productUuid}`)
    setEditProductId(productUuid)
    setEditOpen(true)
  }

  const handleDeleteClick = (productUuid: string, productName: string) => {
    console.log(`[LowStockPage] Opening delete dialog for product: ${productUuid}`)
    console.log(`[LowStockPage] Setting deleteOpen to true`)
    console.log(`[LowStockPage] Product name: ${productName}`)
    setDeleteProductId(productUuid)
    setDeleteProductName(productName)
    setDeleteError(null)
    setDeleteOpen(true)
    console.log(`[LowStockPage] Delete dialog state set`)
  }

  const handleConfirmDelete = async () => {
    if (!deleteProductId) return

    try {
      console.log(`[LowStockPage] Confirming delete for: ${deleteProductId}`)
      await handleDeleteProduct(deleteProductId)
    } catch (err) {
      console.error(`[LowStockPage] Delete failed:`, err)
    }
  }

  const handleBulkExportCSV = () => {
    const selectedData = items.filter(i => selectedItems.has(i.productUuid))
    const dataToExport = selectedData.length > 0 ? selectedData : items

    const rows = [['Product', 'SKU', 'Category', 'Current Stock', 'Minimum Stock', 'Reorder Level', 'Shortfall', 'Unit', 'Purchase Price', 'Value at Risk', 'Status']]
    dataToExport.forEach(i =>
      rows.push([
        i.productName,
        i.sku || '',
        i.categoryName,
        String(i.currentQty),
        String(i.minimumStock),
        String(i.reorderLevel),
        String(i.difference),
        i.unit,
        String(i.purchasePrice),
        String(i.valueAtRisk.toFixed(2)),
        i.status,
      ])
    )

    const csv = rows.map(r => r.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `low-stock-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = summary ? Math.ceil(summary.totalProducts / pageSize) : 1
  const chartData = summary
    ? [
        { name: 'Out of Stock', value: summary.outOfStock, fill: '#dc2626' },
        { name: 'Critical', value: summary.critical, fill: '#ea580c' },
        { name: 'Below Reorder', value: summary.belowReorder, fill: '#eab308' },
      ]
    : []

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <InventoryBackButton />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Low Stock Alerts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time monitoring of products below configured stock levels</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleBulkExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            <Download size={16} /> Export CSV
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.totalProducts}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.outOfStock}</p>
              </div>
              <AlertTriangle className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical Stock</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{summary.critical}</p>
              </div>
              <TrendingDown className="text-orange-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Below Reorder</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.belowReorder}</p>
              </div>
              <ChevronDown className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Value at Risk</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">₹{(summary.inventoryValueAtRisk / 100000).toFixed(1)}L</p>
              </div>
              <DollarSign className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-gray-400"
              placeholder="Search product name, SKU, or code..."
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
              <option value="shortfall">Sort by Shortfall</option>
              <option value="current_qty">Sort by Current Qty</option>
              <option value="reorder_level">Sort by Reorder Level</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
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
          <p className="text-gray-500 dark:text-gray-400 mt-4">Checking stock levels...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && !error && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <Package size={48} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No products need restocking</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">All stock levels are healthy ✓</p>
        </div>
      )}

      {/* Chart */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Stock Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Top Products by Shortfall</h3>
            <div className="space-y-2">
              {items.slice(0, 5).map(item => (
                <div key={item.productUuid} className="flex justify-between text-sm pb-2 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{item.productName}</span>
                  <span className="font-semibold text-red-600">-{item.difference}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === items.length && items.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Current</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Min</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Reorder</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-700 dark:text-red-400">Shortfall</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {items.map(item => (
                    <tr key={item.productUuid} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productUuid)}
                          onChange={() => handleSelectItem(item.productUuid)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku || item.productCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.categoryName}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.currentQty}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.minimumStock}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.reorderLevel}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-red-600 dark:text-red-400">-{item.difference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].badge}`}>
                          {statusConfig[item.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              console.log(`[LowStockPage] Preview button clicked for: ${item.productUuid}`)
                              handlePreviewClick(item.productUuid)
                            }}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 transition"
                            title="Preview Product"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              console.log(`[LowStockPage] Edit button clicked for: ${item.productUuid}`)
                              handleEditClick(item.productUuid)
                            }}
                            className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              console.log(`[LowStockPage] Delete button clicked for: ${item.productUuid}`)
                              handleDeleteClick(item.productUuid, item.productName)
                            }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, summary?.totalProducts || 0)} of {summary?.totalProducts || 0} products
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
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(parseInt(e.target.value))
                  setPage(1)
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <ProductPreviewModal
        productUuid={previewProductId}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewProductId(null)
        }}
        onEdit={(productId) => {
          console.log('[LowStockPage] Edit product from preview:', productId)
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
          console.log('[LowStockPage] Product updated, reloading list')
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
    </div>
  )
}
