'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, Printer } from 'lucide-react'

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  // Mock data - connect to real API later
  const products = [
    { id: 1, name: 'Ashwagandha Powder', sku: 'ASH-001', category: 'Herbal Powders', stock: 450, price: 250 },
    { id: 2, name: 'Brahmi Extract', sku: 'BRH-001', category: 'Extracts', stock: 320, price: 450 },
    { id: 3, name: 'Turmeric (Organic)', sku: 'TRM-001', category: 'Herbal Powders', stock: 125, price: 180 },
    { id: 4, name: 'Sesame Oil', sku: 'OIL-001', category: 'Oils', stock: 89, price: 320 },
    { id: 5, name: 'Ghee (A2)', sku: 'GHE-001', category: 'Ghee', stock: 45, price: 680 },
  ]

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
              <Download size={20} /> Export
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition">
              <Printer size={20} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Product Name</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">SKU</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Category</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Stock</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">Price</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.sku}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{product.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 100 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">₹{product.price}</td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/dashboard/inventory/products/${product.id}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">Showing 5 of 450 products</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm">Previous</button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm">Next</button>
        </div>
      </div>
    </div>
  )
}
