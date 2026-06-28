'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader, Save } from 'lucide-react'
import { ProductService, CategoryService } from '@/lib/inventory'

interface CreateProductForm {
  name: string
  sku: string
  category_id: string
  unit: string
  min_stock: number
  max_stock: number
  hsn_code: string
  tax_rate: number
  reorder_qty: number
}

interface Category {
  id: string
  name: string
}

export default function CreateProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProductForm>({
    name: '',
    sku: '',
    category_id: '',
    unit: '',
    min_stock: 0,
    max_stock: 0,
    hsn_code: '',
    tax_rate: 0,
    reorder_qty: 0,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const cats = await CategoryService.getCategories()
      setCategories(cats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.sku || !formData.category_id || !formData.unit) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      await ProductService.createProduct(formData as any)
      router.push('/dashboard/inventory/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" size={40} />
      </div>
    )
  }

  return (
    <div className="p-8">
      <Link href="/dashboard/inventory/products" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8">
        <ArrowLeft size={20} /> Back to Products
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Create Product</h1>

      <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Ashwagandha Powder"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., ASH-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., kg, litre, pieces"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">HSN Code</label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reorder Qty</label>
              <input
                type="number"
                min="0"
                value={formData.reorder_qty}
                onChange={(e) => setFormData({ ...formData, reorder_qty: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
              {saving ? 'Creating...' : 'Create Product'}
            </button>
            <Link
              href="/dashboard/inventory/products"
              className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
