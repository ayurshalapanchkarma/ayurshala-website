'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface PharmacySettings {
  invoicePrefix: string;
  gstPercent: number;
  sgstPercent: number;
  cgstPercent: number;
  thermalPrinterWidth: number;
  receiptFooter: string;
  defaultPaymentMode: string;
  barcodeFormat: string;
  showQuantityInInvoice: boolean;
  showBatchInInvoice: boolean;
  roundingMethod: string;
  enableQR: boolean;
  enableEmailReceipt: boolean;
  enableSMSReceipt: boolean;
}

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'CHEQUE', 'CREDIT'];
const BARCODE_FORMATS = ['CODE128', 'EAN13', 'QR'];
const ROUNDING_METHODS = ['ROUND', 'CEIL', 'FLOOR'];

export default function PharmacySettings() {
  const [settings, setSettings] = useState<PharmacySettings>({
    invoicePrefix: 'INV',
    gstPercent: 5,
    sgstPercent: 2.5,
    cgstPercent: 2.5,
    thermalPrinterWidth: 80,
    receiptFooter: 'Thank you for your purchase',
    defaultPaymentMode: 'CASH',
    barcodeFormat: 'CODE128',
    showQuantityInInvoice: true,
    showBatchInInvoice: true,
    roundingMethod: 'ROUND',
    enableQR: true,
    enableEmailReceipt: false,
    enableSMSReceipt: false
  });

  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field: keyof PharmacySettings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pharmacy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        showToast('success', 'Settings saved successfully');
      } else {
        showToast('error', 'Failed to save settings');
      }
    } catch (error) {
      showToast('error', 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Pharmacy Settings</h1>

        <div className="space-y-6">
          {/* Invoice Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Invoice Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Prefix
                </label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  placeholder="e.g., INV"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., INV-0001, INV-0002</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Payment Mode
                </label>
                <select
                  value={settings.defaultPaymentMode}
                  onChange={(e) => handleChange('defaultPaymentMode', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barcode Format
                </label>
                <select
                  value={settings.barcodeFormat}
                  onChange={(e) => handleChange('barcodeFormat', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {BARCODE_FORMATS.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rounding Method
                </label>
                <select
                  value={settings.roundingMethod}
                  onChange={(e) => handleChange('roundingMethod', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {ROUNDING_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt Footer Text
              </label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                placeholder="Text shown at bottom of receipts"
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Tax Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total GST %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.gstPercent}
                  onChange={(e) => handleChange('gstPercent', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SGST %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.sgstPercent}
                  onChange={(e) => handleChange('sgstPercent', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CGST %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.cgstPercent}
                  onChange={(e) => handleChange('cgstPercent', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Printer Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Printer Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thermal Printer Width (mm)
                </label>
                <select
                  value={settings.thermalPrinterWidth}
                  onChange={(e) => handleChange('thermalPrinterWidth', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value={58}>58mm</option>
                  <option value={80}>80mm</option>
                  <option value={100}>100mm</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Common thermal printer widths</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Features</h2>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showQuantityInInvoice}
                  onChange={(e) => handleChange('showQuantityInInvoice', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-900 dark:text-white">Show quantity in invoice</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showBatchInInvoice}
                  onChange={(e) => handleChange('showBatchInInvoice', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-900 dark:text-white">Show batch number in invoice</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableQR}
                  onChange={(e) => handleChange('enableQR', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-900 dark:text-white">Enable QR code on receipts</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableEmailReceipt}
                  onChange={(e) => handleChange('enableEmailReceipt', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-900 dark:text-white">Enable email receipts</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableSMSReceipt}
                  onChange={(e) => handleChange('enableSMSReceipt', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="ml-3 text-gray-900 dark:text-white">Enable SMS receipts</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
