'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, Edit, Trash2, Eye, Loader, AlertCircle, Check } from 'lucide-react'

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
      setError(null)
      const productsRes = await fetch('/api/inventory/products')
      if (!productsRes.ok) throw new Error('Failed to load products')
      const productsData = await productsRes.json()
      setProducts(productsData.data || [])

      const categoriesRes = await fetch('/api/inventory/categories')
      if (!categoriesRes.ok) throw new Error('Failed to load categories')
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData.data || [])
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
      const res = await fetch(`/api/inventory/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_deleted: true } : p))
      addToast('Deleted', 'success')
      setDeleteId(null)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
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
    a.download = `products.csv`
    a.click()
    addToast('Exported', 'success')
  }

  if (loading) {
    return <div className="p-8 flex justify-center items-center min-h-screen"><Loader className="animate-spin w-12 h-12 text-primary-600" /></div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={filteredProducts.length === 0} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 text-sm transition">
            <Download size={16} />
          </button>
          <Link href="/admin/inventory/products/create" className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition">
            <Plus size={16} />
            Add Product
          </Link>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg"><p className="text-red-900 dark:text-red-100 text-sm mb-2">{error}</p><button onClick={loadData} className="text-xs text-red-700 hover:underline">Retry</button></div>}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1) }} className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }} className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filteredProducts.length === 0 ? <div className="text-center py-16"><h3 className="text-lg font-semibold mb-2">No products found</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first product</p><Link href="/admin/inventory/products/create" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"><Plus size={16} />Create Product</Link></div> : <>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('sku'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSortBy('sale_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }}>Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">MRP</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {paginatedProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium">{p.sku}</td>
                  <td className="px-6 py-4 text-sm">{p.name}</td>
                  <td className="px-6 py-4 text-sm">{categories.find(c => c.id === p.category_id)?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{p.sale_price}</td>
                  <td className="px-6 py-4 text-sm">₹{p.mrp}</td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Link href={`/admin/inventory/products/${p.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><Eye size={16} /></Link>
                    <Link href={`/admin/inventory/products/${p.id}/edit`} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><Edit size={16} className="text-blue-600" /></Link>
                    <button onClick={() => setDeleteId(p.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><Trash2 size={16} className="text-red-600" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50">Prev</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      </>}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Marked as deleted</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 space-y-3 z-40">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded-lg flex items-center gap-3 ${t.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            {t.type === 'success' ? <Check size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
