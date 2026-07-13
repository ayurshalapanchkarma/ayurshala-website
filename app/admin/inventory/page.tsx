'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Layers, Users, TrendingUp, AlertTriangle, Clock, ShoppingCart, Truck, Plus, Upload, Download, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { InventoryPageWrapper } from '@/components/InventoryPageWrapper'

interface DashboardMetrics {
  products: number
  categories: number
  suppliers: number
  stockValue: number
  lowStock: number
  expiringsoon: number
  pendingPos: number
  todaysGrn: number
}

export default function InventoryOverview() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Fetch metrics from API
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/inventory/dashboard/metrics')
      
      if (!res.ok) {
        throw new Error(`Failed to fetch metrics: ${res.status}`)
      }

      const data = await res.json()
      setMetrics(data.metrics)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('[Metrics Error]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load metrics on mount
  useEffect(() => {
    fetchMetrics()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchMetrics])

  const kpiData = metrics ? [
    { label: 'Products', value: metrics.products.toString(), icon: Package, color: 'blue' },
    { label: 'Categories', value: metrics.categories.toString(), icon: Layers, color: 'purple' },
    { label: 'Suppliers', value: metrics.suppliers.toString(), icon: Users, color: 'green' },
    { label: 'Stock Value', value: `₹${metrics.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'amber' },
    { label: 'Low Stock', value: metrics.lowStock.toString(), icon: AlertTriangle, color: 'red' },
    { label: 'Expiring Soon', value: metrics.expiringsoon.toString(), icon: Clock, color: 'orange' },
    { label: 'Pending POs', value: metrics.pendingPos.toString(), icon: ShoppingCart, color: 'indigo' },
    { label: 'Today\'s GRN', value: metrics.todaysGrn.toString(), icon: Truck, color: 'cyan' },
  ] : []

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50',
    orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
  }

  return (
    <InventoryPageWrapper title="Inventory Overview" subtitle="Track your inventory at a glance">
      <div>
        {/* Back to Admin */}
        <div className="mb-4">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin
          </a>
        </div>

        {/* KPI Cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Key Metrics</h2>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition disabled:opacity-50"
            title="Refresh metrics"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin inline" /> : '↻ Refresh'}
          </button>
        </div>

        {lastRefresh && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading && !metrics ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              kpiData.map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <div key={i} className={`${colorMap[kpi.color]} rounded-lg p-6 border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium opacity-75">{kpi.label}</p>
                        <p className="text-3xl font-semibold mt-3">{kpi.value}</p>
                      </div>
                      <Icon className="w-10 h-10 opacity-20" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
      </div>
    </InventoryPageWrapper>
  )
}
