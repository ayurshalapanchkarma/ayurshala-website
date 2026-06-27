'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Plus, TrendingUp, Package, AlertTriangle, Clock, CheckCircle, XCircle, ShoppingCart } from 'lucide-react'

// Mock data - connect to real API later
const inventoryData = {
  kpis: [
    { label: 'Total Products', value: 450, change: 5.2, icon: Package },
    { label: 'Inventory Value', value: '₹2.4L', change: 12.8, icon: TrendingUp },
    { label: 'Available Stock', value: '12,840 units', change: 8.3, icon: CheckCircle },
    { label: 'Low Stock', value: 34, change: -15.2, icon: AlertTriangle },
    { label: 'Out of Stock', value: 8, change: -100, icon: XCircle },
    { label: 'Expiring (30d)', value: 12, change: 3.1, icon: Clock },
    { label: 'Expired Stock', value: 0, change: 0, icon: AlertTriangle },
    { label: 'Pending POs', value: 5, change: 0, icon: ShoppingCart },
    { label: 'Pending GRNs', value: 3, change: 0, icon: Package },
  ],
  valuetrend: [
    { month: 'Jan', value: 180000 },
    { month: 'Feb', value: 195000 },
    { month: 'Mar', value: 185000 },
    { month: 'Apr', value: 210000 },
    { month: 'May', value: 225000 },
    { month: 'Jun', value: 240000 },
  ],
  topProducts: [
    { name: 'Ashwagandha', sales: 450 },
    { name: 'Brahmi', sales: 380 },
    { name: 'Turmeric Powder', sales: 320 },
    { name: 'Sesame Oil', sales: 280 },
    { name: 'Ghee (Organic)', sales: 250 },
  ],
  categories: [
    { name: 'Herbal Powders', value: 35, fill: '#22c55e' },
    { name: 'Oils & Ghee', value: 28, fill: '#f59e0b' },
    { name: 'Pastes & Tablets', value: 22, fill: '#3b82f6' },
    { name: 'Others', value: 15, fill: '#8b5cf6' },
  ],
}

function KPICard({ label, value, change, icon: Icon }: any) {
  const isPositive = change >= 0
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
          <Icon size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
      </div>
      {change !== 0 && (
        <p className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs last month
        </p>
      )}
    </div>
  )
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function InventoryDashboard() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/inventory/products/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={20} /> Product
          </Link>
          <Link
            href="/dashboard/inventory/purchase-orders/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> PO
          </Link>
          <Link
            href="/dashboard/inventory/grn/create"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} /> GRN
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {inventoryData.kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChartCard title="Inventory Value Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inventoryData.valuetrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis stroke="rgba(0,0,0,0.5)" />
                <YAxis stroke="rgba(0,0,0,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard title="Category Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={inventoryData.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {inventoryData.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Top Moving Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryData.topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" />
              <YAxis stroke="rgba(0,0,0,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: 8 }} />
              <Bar dataKey="sales" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/inventory/products"
              className="block p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-sm font-medium"
            >
              Manage Products
            </Link>
            <Link
              href="/dashboard/inventory/purchase-orders"
              className="block p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-sm font-medium"
            >
              Purchase Orders
            </Link>
            <Link
              href="/dashboard/inventory/current-stock"
              className="block p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-sm font-medium"
            >
              Current Stock
            </Link>
            <Link
              href="/dashboard/inventory/reports"
              className="block p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition text-sm font-medium"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">Product Added: Brahmi Extract</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">GRN Received: PO-2024-001</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">Low Stock Alert: Turmeric Powder</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
