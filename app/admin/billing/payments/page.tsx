'use client';

import { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';

interface Payment {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  referenceNumber: string;
  status: string;
}

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'CREDIT'];

export default function BillingPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMode: 'CASH',
    referenceNumber: ''
  });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const searchInvoices = async (query: string) => {
    if (!query) {
      setInvoiceResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/billing/invoices?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const { data } = await res.json();
        setInvoiceResults(data?.filter((inv: any) => inv.balance_amount > 0) || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoice_number);
    setInvoiceResults([]);
    setPaymentData({ ...paymentData, amount: invoice.balance_amount });
  };

  const recordPayment = async () => {
    if (!selectedInvoice || paymentData.amount <= 0) {
      showToast('error', 'Invalid payment amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${selectedInvoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentData.amount,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber
        })
      });

      if (res.ok) {
        showToast('success', 'Payment recorded');
        setShowCreateModal(false);
        setSelectedInvoice(null);
        setInvoiceSearch('');
        setPaymentData({ amount: 0, paymentMode: 'CASH', referenceNumber: '' });
        // Reload payments
        loadPayments();
      }
    } catch (error) {
      showToast('error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    // Load recent payments
    try {
      const res = await fetch('/api/billing/invoices?limit=20');
      if (res.ok) {
        const { data } = await res.json();
        // Filter paid invoices
        const paidInvoices = data?.filter((inv: any) => inv.paid_amount > 0) || [];
        setPayments(paidInvoices.map((inv: any) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          patientName: inv.patient?.name || 'Unknown',
          amount: inv.paid_amount,
          paymentMode: 'RECORDED',
          paymentDate: inv.updated_at,
          referenceNumber: inv.id.slice(0, 8),
          status: 'COMPLETED'
        })));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Record payments and manage collections</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              loadPayments();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Mode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No payments recorded yet
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{payment.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{payment.patientName}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{payment.paymentMode}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Record Payment</h2>

            {!selectedInvoice ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Invoice</label>
                <input
                  type="text"
                  placeholder="Enter invoice number..."
                  value={invoiceSearch}
                  onChange={(e) => {
                    setInvoiceSearch(e.target.value);
                    searchInvoices(e.target.value);
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mb-2"
                />

                {invoiceResults.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                    {invoiceResults.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => selectInvoice(inv)}
                        className="p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{inv.invoice_number}</div>
                        <div className="text-xs text-gray-500">Outstanding: ₹{inv.balance_amount?.toFixed(2) || '0'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedInvoice.invoice_number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Outstanding: ₹{selectedInvoice.balance_amount?.toFixed(2) || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedInvoice.balance_amount}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Mode</label>
                  <select
                    value={paymentData.paymentMode}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {PAYMENT_MODES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference #</label>
                  <input
                    type="text"
                    placeholder="Transaction ID / Cheque No"
                    value={paymentData.referenceNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={recordPayment}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Record
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
