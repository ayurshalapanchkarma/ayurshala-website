'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, Printer, Edit, Trash2, Eye, Loader } from 'lucide-react'
import { ProductService } from '@/lib/inventory'

interface Product {
  id: string
  name: string
  sku: string
  category_id: string
  unit: string
  min_stock: number
  max_stock: number
  hsn_code?: string
  tax_rate?: number
  reorder_qty?: number
  manufacturer_id?: string
  supplier_id?: string
  is_deleted: boolean
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await ProductService.getProducts()
      setProducts(data as any)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure? This will soft-delete the product.')) return
    try {
      await ProductService.deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  const filtered = products
    .filter(p => !p.is_deleted && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'sku') return a.sku.localeCompare(b.sku)
      return 0
    })

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={40} />
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          <button onClick={loadProducts} className="mt-2 text-red-600 dark:text-red-400 hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Products</h1>
        <Link
          href="/dashboard/inventory/products/create"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={20} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="sku">Sort by SKU</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-sm font-medium">
            <Download size={20} /> Export CSV
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-sm font-medium">
            <Printer size={20} /> Print
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">SKU</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Unit</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Min Stock</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Max Stock</th>
                    <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {paginated.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.sku}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.unit}</td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">{product.min_stock}</td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">{product.max_stock}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link href={`/dashboard/inventory/products/${product.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700">
                            <Eye size={18} />
                          </Link>
                          <Link href={`/dashboard/inventory/products/${product.id}/edit`} className="text-amber-600 dark:text-amber-400 hover:text-amber-700">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => deleteProduct(product.id)} className="text-red-600 dark:text-red-400 hover:text-red-700">
                            <Trash2 size={18} />
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
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
