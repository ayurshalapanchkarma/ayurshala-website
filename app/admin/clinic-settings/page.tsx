'use client';

import { useEffect, useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface ClinicSettings {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  gstNumber: string;
  invoicePrefix: string;
  pharmacyPrefix: string;
  receiptFooter: string;
  defaultCurrency: string;
  timezone: string;
}

export default function ClinicSettings() {
  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: 'Ayurshala Panchakarma Centre',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    gstNumber: '',
    invoicePrefix: 'INV',
    pharmacyPrefix: 'PH',
    receiptFooter: 'Thank you for visiting Ayurshala Panchakarma Centre',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/clinic/settings');
      if (res.ok) {
        const { data } = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/clinic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Settings saved successfully' });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ type: 'error', message: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setToast({ type: 'error', message: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Clinic Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage Ayurshala Panchakarma Centre configuration</p>
        </div>

        {/* Alert */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            These settings apply to the entire Ayurshala Panchakarma Centre clinic. Changes will affect all invoices, receipts, and reports.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-6 p-4 rounded-lg flex gap-3 ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className={`text-sm ${
              toast.type === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 space-y-6">
          {/* Clinic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clinic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={settings.clinicName}
                  onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea
                  value={settings.clinicAddress}
                  onChange={(e) => setSettings({ ...settings, clinicAddress: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={settings.clinicPhone}
                    onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.clinicEmail}
                    onChange={(e) => setSettings({ ...settings, clinicEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                  placeholder="e.g., 27AABCT1234A1Z5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Billing & Numbering */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing & Numbering</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="e.g., INV"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pharmacy Prefix</label>
                  <input
                    type="text"
                    value={settings.pharmacyPrefix}
                    onChange={(e) => setSettings({ ...settings, pharmacyPrefix: e.target.value })}
                    placeholder="e.g., PH"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Text</label>
                <textarea
                  value={settings.receiptFooter}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  rows={2}
                  placeholder="Text shown at bottom of receipts"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
