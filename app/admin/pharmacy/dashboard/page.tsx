'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, ShoppingCart, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface DashboardMetrics {
  todaysSales: number;
  todaysRevenue: number;
  todaysBills: number;
  pendingPayments: number;
  todaysRefunds: number;
  averageBillAmount: number;
  lowStockItems: number;
  expiringBatches: number;
  topMedicines: any[];
  recentBills: any[];
  paymentModeSummary: any;
  hourlyRevenue: any[];
  paymentModeChart: any[];
}

export default function PharmacyDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const res = await fetch('/api/pharmacy/dashboard');
      if (res.ok) {
        const { data } = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  const Card = ({ children, className = '' }: any) => (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
  );

  const CardHeader = ({ children }: any) => (
    <div className="border-b border-gray-200 dark:border-gray-700 p-6">{children}</div>
  );

  const CardTitle = ({ children }: any) => (
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{children}</h3>
  );

  const CardContent = ({ children }: any) => <div className="p-6">{children}</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Pharmacy & POS Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Ayurshala Panchakarma Centre - Medicine Sales & Inventory</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-l-4 border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Today's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.todaysSales}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Invoices created</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Today's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{metrics.todaysRevenue.toFixed(0)}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount collected</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.pendingPayments}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-l-4 border-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.lowStockItems}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items below reorder level</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Revenue */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Hourly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.hourlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Mode Distribution */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Payment Modes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.paymentModeChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {metrics.paymentModeChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions & Top Medicines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bills */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Recent Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {metrics.recentBills.slice(0, 5).map((bill) => (
                  <div key={bill.billId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{bill.billNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{bill.patientName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">₹{bill.totalAmount.toFixed(0)}</div>
                      <div className={`text-xs ${bill.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>
                        {bill.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Medicines */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Top Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {metrics.topMedicines.slice(0, 5).map((medicine) => (
                  <div key={medicine.productId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{medicine.productName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{medicine.quantitySold} units sold</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">₹{medicine.revenue.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
