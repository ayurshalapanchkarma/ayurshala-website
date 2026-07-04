'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface VitalsFormData {
  systolic_bp: string;
  diastolic_bp: string;
  pulse_rate: string;
  temperature_c: string;
  respiratory_rate: string;
  spo2: string;
  height_cm: string;
  weight_kg: string;
}

export default function VitalsPage({ params }: { params: { visitId: string } }) {
  const router = useRouter();
  const { visitId } = params;

  const [visit, setVisit] = useState<any>(null);
  const [formData, setFormData] = useState<VitalsFormData>({
    systolic_bp: '',
    diastolic_bp: '',
    pulse_rate: '',
    temperature_c: '',
    respiratory_rate: '',
    spo2: '',
    height_cm: '',
    weight_kg: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bmi, setBmi] = useState<string | null>(null);

  // Load visit details
  useEffect(() => {
    const loadVisit = async () => {
      try {
        const res = await fetch(`/api/emr/visits/${visitId}`);
        if (!res.ok) throw new Error('Failed to load visit');

        const { data } = await res.json();
        setVisit(data);
      } catch (err) {
        console.error('Error loading visit:', err);
        setError('Failed to load visit');
      } finally {
        setLoading(false);
      }
    };

    loadVisit();
  }, [visitId]);

  // Calculate BMI when height and weight change
  useEffect(() => {
    if (formData.height_cm && formData.weight_kg) {
      const heightM = parseFloat(formData.height_cm) / 100;
      const weight = parseFloat(formData.weight_kg);
      if (heightM > 0 && weight > 0) {
        const calculatedBmi = (weight / (heightM * heightM)).toFixed(2);
        setBmi(calculatedBmi);
      }
    } else {
      setBmi(null);
    }
  }, [formData.height_cm, formData.weight_kg]);

  const handleInputChange = (field: keyof VitalsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // At least some vitals should be recorded
      const hasData = Object.values(formData).some(v => v !== '');
      if (!hasData) {
        setError('Please record at least one vital sign');
        setSubmitting(false);
        return;
      }

      const vitalsData: any = {
        recorded_by: 'current-user-id' // TODO: Get from auth
      };

      // Only include non-empty fields
      if (formData.systolic_bp) vitalsData.systolic_bp = parseInt(formData.systolic_bp);
      if (formData.diastolic_bp) vitalsData.diastolic_bp = parseInt(formData.diastolic_bp);
      if (formData.pulse_rate) vitalsData.pulse_rate = parseInt(formData.pulse_rate);
      if (formData.temperature_c) vitalsData.temperature_c = parseFloat(formData.temperature_c);
      if (formData.respiratory_rate) vitalsData.respiratory_rate = parseInt(formData.respiratory_rate);
      if (formData.spo2) vitalsData.spo2 = parseInt(formData.spo2);
      if (formData.height_cm) vitalsData.height_cm = parseFloat(formData.height_cm);
      if (formData.weight_kg) vitalsData.weight_kg = parseFloat(formData.weight_kg);

      const res = await fetch(`/api/emr/visits/${visitId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitalsData)
      });

      if (!res.ok) throw new Error('Failed to save vitals');

      // Redirect to queue or doctor dashboard
      router.push('/reception/queue');
    } catch (err) {
      console.error('Error saving vitals:', err);
      setError(err instanceof Error ? err.message : 'Failed to save vitals');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading visit...</div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Visit not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Record Vitals</h1>
          <p className="text-gray-600 mb-6">Visit #{visit.visit_number}</p>

          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Patient</p>
                <p className="font-semibold text-gray-900">{visit.patient_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Doctor</p>
                <p className="font-semibold text-gray-900">{visit.doctor_name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Blood Pressure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.systolic_bp}
                  onChange={(e) => handleInputChange('systolic_bp', e.target.value)}
                  placeholder="e.g., 120"
                  min="60"
                  max="250"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.diastolic_bp}
                  onChange={(e) => handleInputChange('diastolic_bp', e.target.value)}
                  placeholder="e.g., 80"
                  min="40"
                  max="150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* Pulse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pulse Rate (bpm)
                </label>
                <input
                  type="number"
                  value={formData.pulse_rate}
                  onChange={(e) => handleInputChange('pulse_rate', e.target.value)}
                  placeholder="e.g., 72"
                  min="30"
                  max="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature_c}
                  onChange={(e) => handleInputChange('temperature_c', e.target.value)}
                  placeholder="e.g., 98.6"
                  min="35"
                  max="42"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* Respiratory Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respiratory Rate (breaths/min)
                </label>
                <input
                  type="number"
                  value={formData.respiratory_rate}
                  onChange={(e) => handleInputChange('respiratory_rate', e.target.value)}
                  placeholder="e.g., 16"
                  min="8"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* SpO2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SpO₂ (%)
                </label>
                <input
                  type="number"
                  value={formData.spo2}
                  onChange={(e) => handleInputChange('spo2', e.target.value)}
                  placeholder="e.g., 98"
                  min="70"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.height_cm}
                  onChange={(e) => handleInputChange('height_cm', e.target.value)}
                  placeholder="e.g., 170"
                  min="100"
                  max="250"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.weight_kg}
                  onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                  placeholder="e.g., 70"
                  min="20"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* BMI Display */}
            {bmi && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Calculated BMI</p>
                <p className="text-2xl font-bold text-green-700">{bmi}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Saving...' : 'Save Vitals'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
