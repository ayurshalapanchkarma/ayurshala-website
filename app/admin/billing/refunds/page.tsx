'use client';

import { useState } from 'react';
import { Plus, XCircle } from 'lucide-react';

interface Refund {
  id: string;
  refundNumber: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

const REFUND_REASONS = ['FULL_CANCELLATION', 'PARTIAL_RETURN', 'BILLING_ERROR', 'SERVICE_NOT_PROVIDED', 'OTHER'];

export default function BillingRefunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [refundData, setRefundData] = useState({
    amount: 0,
    reason: 'BILLING_ERROR',
    notes: ''
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
        setInvoiceResults(data?.filter((inv: any) => inv.status === 'FINALIZED') || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoice_number);
    setInvoiceResults([]);
    setRefundData({ ...refundData, amount: invoice.paid_amount });
  };

  const createRefund = async () => {
    if (!selectedInvoice || refundData.amount <= 0) {
      showToast('error', 'Invalid refund amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: refundData.amount,
          reason: refundData.reason,
          notes: refundData.notes
        })
      });

      if (res.ok) {
        showToast('success', 'Refund created');
        setShowCreateModal(false);
        setSelectedInvoice(null);
        setInvoiceSearch('');
        setRefundData({ amount: 0, reason: 'BILLING_ERROR', notes: '' });
      }
    } catch (error) {
      showToast('error', 'Failed to create refund');
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (refundId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/refunds/${refundId}/process`, {
        method: 'POST'
      });

      if (res.ok) {
        showToast('success', 'Refund processed');
        // Reload refunds
      }
    } catch (error) {
      showToast('error', 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const cancelRefund = async (refundId: string) => {
    if (!confirm('Cancel this refund?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/billing/refunds/${refundId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('success', 'Refund cancelled');
      }
    } catch (error) {
      showToast('error', 'Failed to cancel refund');
    } finally {
      setLoading(false);
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Refunds Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create and process refunds</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            New Refund
          </button>
        </div>

        {/* Refunds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Refund #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No refunds recorded yet
                    </td>
                  </tr>
                ) : (
                  refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{refund.refundNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{refund.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{refund.patientName}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{refund.reason}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{refund.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                          refund.status === 'PROCESSED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {refund.status}
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

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Refund</h2>

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
                        <div className="text-xs text-gray-500">Paid: ₹{inv.paid_amount?.toFixed(2) || '0'}</div>
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
                    Paid Amount: ₹{selectedInvoice.paid_amount?.toFixed(2) || '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Refund Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedInvoice.paid_amount}
                    value={refundData.amount}
                    onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                  <select
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {REFUND_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={refundData.notes}
                    onChange={(e) => setRefundData({ ...refundData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
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
                    onClick={createRefund}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 font-medium"
                  >
                    Create Refund
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
