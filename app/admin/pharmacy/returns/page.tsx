'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';

interface ReturnItem {
  billItemId: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  batchNumber: string;
  reason: 'DAMAGED' | 'EXPIRED' | 'WRONG_ITEM' | 'PATIENT_RETURN' | 'BILLING_ERROR';
}

interface Return {
  id: string;
  billId: string;
  billNumber: string;
  items: ReturnItem[];
  refundAmount: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  reason: string;
  createdAt: string;
}

const RETURN_REASONS = ['DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'PATIENT_RETURN', 'BILLING_ERROR'];

export default function PharmacyReturns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchBillNumber, setSearchBillNumber] = useState('');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy/returns');
      if (res.ok) {
        const { data } = await res.json();
        setReturns(data || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchBills = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/pharmacy/bills?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const { data } = await res.json();
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectBill = (bill: any) => {
    setSelectedBill(bill);
    setSearchBillNumber(bill.bill_number);
    setSearchResults([]);

    // Initialize return items from bill items
    const items: ReturnItem[] = (bill.items || []).map((item: any) => ({
      billItemId: item.id,
      productId: item.product_id,
      productName: item.product?.name || 'Unknown',
      originalQuantity: item.quantity,
      returnQuantity: 0,
      unitPrice: item.unit_price,
      batchNumber: item.batch?.batch_number || '',
      reason: 'PATIENT_RETURN'
    }));

    setReturnItems(items);
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    const item = returnItems[index];
    if (quantity < 0 || quantity > item.originalQuantity) {
      showToast('error', `Quantity must be between 0 and ${item.originalQuantity}`);
      return;
    }
    item.returnQuantity = quantity;
    setReturnItems([...returnItems]);
  };

  const updateReturnReason = (index: number, reason: string) => {
    returnItems[index].reason = reason as any;
    setReturnItems([...returnItems]);
  };

  const calculateRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQuantity * item.unitPrice), 0);
  };

  const createReturn = async () => {
    if (!selectedBill) {
      showToast('error', 'Select a bill first');
      return;
    }

    const itemsToReturn = returnItems.filter(i => i.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      showToast('error', 'Select items to return');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: selectedBill.id,
          items: itemsToReturn,
          return_type: itemsToReturn.some(i => i.returnQuantity < i.originalQuantity) ? 'PARTIAL' : 'FULL'
        })
      });

      if (res.ok) {
        const { data } = await res.json();
        showToast('success', 'Return created successfully');
        setShowCreateModal(false);
        setSelectedBill(null);
        setReturnItems([]);
        setSearchBillNumber('');
        loadReturns();
      }
    } catch (error) {
      showToast('error', 'Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  const postReturn = async (returnId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/returns/${returnId}/post`, {
        method: 'POST'
      });

      if (res.ok) {
        showToast('success', 'Return posted successfully');
        loadReturns();
      }
    } catch (error) {
      showToast('error', 'Failed to post return');
    } finally {
      setLoading(false);
    }
  };

  const cancelReturn = async (returnId: string) => {
    if (!confirm('Cancel this return?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/returns/${returnId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('success', 'Return cancelled');
        loadReturns();
      }
    } catch (error) {
      showToast('error', 'Failed to cancel return');
    } finally {
      setLoading(false);
    }
  };

  const totalRefund = calculateRefund();

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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Returns Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Process medicine returns and refunds</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            New Return
          </button>
        </div>

        {/* Returns List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Return #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Refund</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No returns found</td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{ret.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{ret.billNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{ret.items.length} items</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">₹{ret.refundAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          ret.status === 'POSTED' ? 'bg-green-100 text-green-800' :
                          ret.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end gap-2">
                        {ret.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => postReturn(ret.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                              title="Post return"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => cancelReturn(ret.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                              title="Cancel return"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Return</h2>

            {!selectedBill ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Bill</label>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Enter bill number..."
                    value={searchBillNumber}
                    onChange={(e) => {
                      setSearchBillNumber(e.target.value);
                      searchBills(e.target.value);
                    }}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((bill) => (
                      <div
                        key={bill.id}
                        onClick={() => selectBill(bill)}
                        className="p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{bill.bill_number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {bill.patient?.name || 'Walk-in'} - ₹{bill.total_amount?.toFixed(2) || '0'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedBill.bill_number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total: ₹{selectedBill.total_amount?.toFixed(2) || '0'}</div>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Select items to return:</h3>
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">{item.productName}</div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">Return Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.originalQuantity}
                            value={item.returnQuantity}
                            onChange={(e) => updateReturnQuantity(idx, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">Of {item.originalQuantity}</label>
                          <div className="px-2 py-1 text-sm font-medium text-gray-900 dark:text-white">
                            ₹{(item.returnQuantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">Reason</label>
                          <select
                            value={item.reason}
                            onChange={(e) => updateReturnReason(idx, e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs"
                          >
                            {RETURN_REASONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Refund:</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{totalRefund.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedBill(null);
                      setReturnItems([]);
                      setSearchBillNumber('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createReturn}
                    disabled={loading || totalRefund === 0}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Creating...' : 'Create Return'}
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
