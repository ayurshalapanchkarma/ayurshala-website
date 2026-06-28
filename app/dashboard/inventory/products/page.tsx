'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, Edit, Trash2, Eye, Loader, AlertCircle, Check } from 'lucide-react'
import { ProductService, CategoryService } from '@/lib/inventory'

interface Product {
  id: string
  sku: string
  name: string
  category_id: string
  unit: string
  purchase_price: number
  sale_price: number
  mrp: number
  gst_percent: number
  reorder_level: number
  is_deleted: boolean
}

interface Category {
  id: string
  name: string
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [categories, setCategories] = useState<Category[]>([])
  const [filterCategory, setFilterCategory] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories(),
      ])
      setProducts(productsData as any)
      setCategories(categoriesData as any)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => !p.is_deleted)

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
    }

    if (filterCategory) {
      filtered = filtered.filter(p => p.category_id === filterCategory)
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Product]
      let bVal: any = b[sortBy as keyof Product]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal as string).toLowerCase()
      }

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return filtered
  }, [products, searchTerm, filterCategory, sortBy, sortOrder])

  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  async function handleDelete(id: string) {
    try {
      await ProductService.deleteProduct(id)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_deleted: true } : p))
      addToast('Product deleted', 'success')
      setDeleteId(null)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete', 'error')
    }
  }

  function exportCSV() {
    const headers = ['SKU', 'Name', 'Category', 'Sale Price', 'MRP', 'GST %']
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      categories.find(c => c.id === p.category_id)?.name || '-',
      p.sale_price,
      p.mrp,
      p.gst_percent,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    addToast('Exported successfully', 'success')
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin w-12 h-12 mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage product catalog</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} disabled={filteredProducts.length === 0} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50">
            <Download size={18} /> Export
          </button>
          <Link href="/dashboard/inventory/products/create" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus size={18} /> Add
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">{error}</p>
            <button onClick={loadData} className="text-sm text-red-700 dark:text-red-300 hover:underline mt-1">Retry</button>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1) }} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No products</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first product to get started</p>
          <Link href="/dashboard/inventory/products/create" className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus size={18} /> Create Product
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('sku'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>SKU</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('sale_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>Sale Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">MRP</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {paginatedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{p.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{categories.find(c => c.id === p.category_id)?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">₹{p.sale_price}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{p.mrp}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Link href={`/dashboard/inventory/products/${p.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded" title="View">
                          <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                        </Link>
                        <Link href={`/dashboard/inventory/products/${p.id}/edit`} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded" title="Edit">
                          <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                        </Link>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded" title="Delete">
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50">Prev</button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-4 py-2 rounded-lg ${page === p ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Product?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">This will be marked as deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 space-y-3 z-40">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded-lg flex items-center gap-3 ${t.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            {t.type === 'success' ? <Check className="text-green-600 dark:text-green-400" size={20} /> : <AlertCircle className="text-red-600 dark:text-red-400" size={20} />}
            <span className={t.type === 'success' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
