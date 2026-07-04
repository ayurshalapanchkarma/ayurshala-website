'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function BillingDailyClosing() {
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [closingData, setClosingData] = useState({
    cashCollected: 0,
    cashExpected: 0,
    cashVariance: 0,
    upiCollected: 0,
    upiExpected: 0,
    upiVariance: 0,
    cardCollected: 0,
    cardExpected: 0,
    cardVariance: 0,
    bankCollected: 0,
    bankExpected: 0,
    bankVariance: 0,
    creditCollected: 0,
    creditExpected: 0,
    creditVariance: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalVariance: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadExpectedAmounts = async () => {
    try {
      const res = await fetch(`/api/billing/daily-closing?date=${closingDate}`);
      if (res.ok) {
        const { data } = await res.json();
        setClosingData(prev => ({
          ...prev,
          cashExpected: data.cashExpected || 0,
          upiExpected: data.upiExpected || 0,
          cardExpected: data.cardExpected || 0,
          bankExpected: data.bankExpected || 0,
          creditExpected: data.creditExpected || 0,
          totalExpected: (data.cashExpected || 0) + (data.upiExpected || 0) + (data.cardExpected || 0) + (data.bankExpected || 0) + (data.creditExpected || 0)
        }));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const handleAmountChange = (field: string, value: number) => {
    setClosingData(prev => {
      const updated = { ...prev, [field]: value };

      // Calculate variances
      if (field.endsWith('Collected')) {
        const prefix = field.replace('Collected', '');
        updated[`${prefix}Variance` as keyof typeof closingData] = value - (updated[`${prefix}Expected` as keyof typeof closingData] as number);
      }

      // Calculate totals
      updated.totalCollected = (updated.cashCollected || 0) + (updated.upiCollected || 0) + (updated.cardCollected || 0) + (updated.bankCollected || 0) + (updated.creditCollected || 0);
      updated.totalVariance = updated.totalCollected - updated.totalExpected;

      return updated;
    });
  };

  const submitClosing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/daily-closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingDate,
          ...closingData
        })
      });

      if (res.ok) {
        showToast('success', 'Daily closing completed');
        setSubmitted(true);
      } else {
        showToast('error', 'Failed to complete closing');
      }
    } catch (error) {
      showToast('error', 'Error submitting closing');
    } finally {
      setLoading(false);
    }
  };

  const PaymentModeRow = ({ mode, collected, expected, variance }: any) => (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{mode}</div>
      </div>
      <div>
        <input
          type="number"
          min="0"
          value={collected}
          onChange={(e) => handleAmountChange(`${mode.toLowerCase()}Collected`, parseFloat(e.target.value) || 0)}
          placeholder="Amount collected"
          className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
        />
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Collected</div>
      </div>
      <div>
        <div className="px-3 py-2 bg-white dark:bg-gray-600 rounded text-sm font-semibold text-gray-900 dark:text-white">
          ₹{expected.toFixed(2)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Expected</div>
      </div>
      <div className={`px-3 py-2 rounded text-sm font-bold ${variance >= 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'}`}>
        {variance >= 0 ? '+' : ''}₹{variance.toFixed(2)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Daily Closing</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">End-of-day reconciliation</p>

        {!submitted ? (
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Closing Date</label>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <button
                  onClick={loadExpectedAmounts}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Load Expected
                </button>
              </div>
            </div>

            {/* Payment Modes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payment Reconciliation</h2>

              <div className="space-y-3">
                <PaymentModeRow
                  mode="CASH"
                  collected={closingData.cashCollected}
                  expected={closingData.cashExpected}
                  variance={closingData.cashVariance}
                />
                <PaymentModeRow
                  mode="UPI"
                  collected={closingData.upiCollected}
                  expected={closingData.upiExpected}
                  variance={closingData.upiVariance}
                />
                <PaymentModeRow
                  mode="CARD"
                  collected={closingData.cardCollected}
                  expected={closingData.cardExpected}
                  variance={closingData.cardVariance}
                />
                <PaymentModeRow
                  mode="BANK"
                  collected={closingData.bankCollected}
                  expected={closingData.bankExpected}
                  variance={closingData.bankVariance}
                />
                <PaymentModeRow
                  mode="CREDIT"
                  collected={closingData.creditCollected}
                  expected={closingData.creditExpected}
                  variance={closingData.creditVariance}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Summary</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total Expected</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{closingData.totalExpected.toFixed(2)}</div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Total Collected</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{closingData.totalCollected.toFixed(2)}</div>
                </div>

                <div className={`p-4 rounded-lg ${closingData.totalVariance >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
                  <div className={`text-xs font-semibold ${closingData.totalVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Total Variance
                  </div>
                  <div className={`text-2xl font-bold ${closingData.totalVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {closingData.totalVariance >= 0 ? '+' : ''}₹{closingData.totalVariance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={closingData.notes}
                  onChange={(e) => setClosingData({ ...closingData, notes: e.target.value })}
                  placeholder="Any notes about the closing..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                onClick={submitClosing}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Completing...' : 'Complete Closing'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">Daily Closing Completed</h2>
            <p className="text-green-700 dark:text-green-300">Reconciliation has been locked for {closingDate}</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              New Closing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
