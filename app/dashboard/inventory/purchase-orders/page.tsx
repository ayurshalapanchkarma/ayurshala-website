'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Edit, Loader } from 'lucide-react'
import { PurchaseOrderService } from '@/lib/inventory'

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await PurchaseOrderService.getPurchaseOrders()
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter(
    o => !o.is_deleted && (o.po_number?.includes(searchTerm) || o.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader className="animate-spin" size={40} /></div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
        <Link
          href="/dashboard/inventory/purchase-orders/create"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={20} /> Create PO
        </Link>
      </div>

      {error && <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 rounded"><p className="text-red-700 dark:text-red-400">{error}</p></div>}

      <div className="bg-white dark:bg-slate-800 rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-lg px-4 py-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by PO number or supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border p-12 text-center text-gray-600">No purchase orders found</div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">PO Number</th>
                  <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-3 text-left font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {paginated.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 font-medium">{po.po_number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{po.supplier_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">₹{po.total_amount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        po.status === 'approved' ? 'bg-green-100 text-green-800' :
                        po.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {po.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center flex gap-3 justify-center">
                      <Link href={`/dashboard/inventory/purchase-orders/${po.id}`} className="text-blue-600"><Eye size={18} /></Link>
                      <Link href={`/dashboard/inventory/purchase-orders/${po.id}/edit`} className="text-amber-600"><Edit size={18} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50 text-sm">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50 text-sm">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
