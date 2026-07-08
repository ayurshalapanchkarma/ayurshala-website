'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Package, AlertTriangle, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { toast } from 'sonner'
import InventoryPageHeader from '@/components/inventory/InventoryPageHeader'

interface DashboardData {
  stock: {
    totalProducts: number
    totalActiveProducts: number
    lowStockCount: number
    expiringCount: number
    outOfStockCount: number
    totalInventoryValue: number
  }
  purchaseOrders: {
    draft: number
    pending: number
    approved: number
    partiallyReceived: number
    totalValuePending: number
  }
  grn: {
    draft: number
    posted: number
    totalPostedToday: number
    totalPostedThisMonth: number
  }
  lastUpdated: string
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchDashboard() {
    try {
      const response = await fetch('/api/inventory/dashboard')
      if (!response.ok) throw new Error('Failed to fetch')

      const data: DashboardData = await response.json()
      setDashboard(data)
    } catch (error) {
      console.error('Error:', error)
      if (loading) toast.error('Failed to fetch dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Failed to load dashboard</div>
      </div>
    )
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    trendUp,
  }: {
    icon: React.ComponentType<{ size: number }>
    label: string
    value: string | number
    trend?: string
    trendUp?: boolean
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
          <Icon size={24} className="text-blue-600 dark:text-blue-300" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <InventoryPageHeader
        icon={BarChart3}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-100 dark:bg-purple-950/40"
        title="Dashboard"
        subtitle="Inventory analytics"
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(dashboard.lastUpdated).toLocaleTimeString()}
        </p>
      </div>

      {/* Stock Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stock Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Package}
            label="Total Products"
            value={dashboard.stock.totalProducts}
          />
          <StatCard
            icon={TrendingUp}
            label="Active Products"
            value={dashboard.stock.totalActiveProducts}
          />
          <StatCard
            icon={DollarSign}
            label="Inventory Value"
            value={`₹${(dashboard.stock.totalInventoryValue / 100000).toFixed(1)}L`}
          />
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Critical Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={AlertTriangle}
            label="Low Stock Items"
            value={dashboard.stock.lowStockCount}
            trendUp={false}
          />
          <StatCard
            icon={Clock}
            label="Expiring Soon (90 days)"
            value={dashboard.stock.expiringCount}
            trendUp={false}
          />
          <StatCard
            icon={Package}
            label="Out of Stock"
            value={dashboard.stock.outOfStockCount}
            trendUp={false}
          />
        </div>
      </div>

      {/* Purchase Orders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Purchase Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            icon={Clock}
            label="Draft"
            value={dashboard.purchaseOrders.draft}
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={dashboard.purchaseOrders.pending}
          />
          <StatCard
            icon={BarChart3}
            label="Approved"
            value={dashboard.purchaseOrders.approved}
          />
          <StatCard
            icon={TrendingUp}
            label="Partially Received"
            value={dashboard.purchaseOrders.partiallyReceived}
          />
          <StatCard
            icon={DollarSign}
            label="Pending Value"
            value={`₹${(dashboard.purchaseOrders.totalValuePending / 100000).toFixed(1)}L`}
          />
        </div>
      </div>

      {/* GRN Summary */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Goods Receipt</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Draft GRNs"
            value={dashboard.grn.draft}
          />
          <StatCard
            icon={BarChart3}
            label="Posted GRNs"
            value={dashboard.grn.posted}
          />
          <StatCard
            icon={DollarSign}
            label="Today's Receipt"
            value={`₹${(dashboard.grn.totalPostedToday / 1000).toFixed(0)}K`}
          />
          <StatCard
            icon={TrendingUp}
            label="This Month"
            value={`₹${(dashboard.grn.totalPostedThisMonth / 100000).toFixed(1)}L`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6">
          <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">Healthy Inventory</h3>
          <p className="text-sm text-green-700 dark:text-green-200">
            {dashboard.stock.totalActiveProducts} products in stock with good availability
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <h3 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">Attention Required</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-200">
            {dashboard.stock.lowStockCount + dashboard.stock.expiringCount} items need attention
          </p>
        </div>
      </div>
    </div>
  )
}
