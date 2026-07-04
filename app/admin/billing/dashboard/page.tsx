'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface DashboardData {
  todaysRevenue: number;
  todaysCollections: number;
  pendingAmount: number;
  refundsIssued: number;
  invoicesCreated: number;
  averageBillAmount: number;
  outstandingInvoices: number;
  paymentModeBreakdown: any;
  recentInvoices: any[];
  outstandingPatients: any[];
  doctorRevenue: any[];
}

export default function BillingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/billing/dashboard');
      if (res.ok) {
        const { data } = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Clinic Billing Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Ayurshala Panchakarma Centre - Revenue & Collections</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.todaysRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Collections</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.todaysCollections.toFixed(0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{data.pendingAmount.toFixed(0)}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Outstanding Invoices</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.outstandingInvoices}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Recent Transactions & Outstanding Patients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Invoices */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentInvoices.slice(0, 5).map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{invoice.patient_name || 'Unknown'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">₹{invoice.total_amount?.toFixed(0) || '0'}</div>
                    <div className={`text-xs ${invoice.status === 'FINALIZED' ? 'text-green-600' : 'text-amber-600'}`}>
                      {invoice.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outstanding Patients */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Outstanding Patients</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.outstandingPatients.slice(0, 5).map((patient: any) => (
                <div key={patient.patientId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{patient.patientName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{patient.invoiceCount} invoices</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">₹{patient.outstandingAmount?.toFixed(0) || '0'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Doctor Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.doctorRevenue.slice(0, 6).map((doctor: any) => (
              <div key={doctor.doctorId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-white mb-2">{doctor.doctorName}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{doctor.revenue?.toFixed(0) || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Invoices:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{doctor.invoiceCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
