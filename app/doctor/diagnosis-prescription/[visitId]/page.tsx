'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Visit {
  uuid: string;
  visit_number: string;
  patient?: { name: string };
}

interface Diagnosis {
  id: string;
  visit_uuid: string;
  diagnosis_status: 'DRAFT' | 'FINALIZED';
  primary_diagnosis: string;
  secondary_diagnoses?: string;
  clinical_notes?: string;
}

interface Prescription {
  id: string;
  visit_uuid: string;
  prescription_status: 'DRAFT' | 'FINALIZED' | 'DISPENSED';
  medicines: string;
  dosage?: string;
  duration?: string;
  special_instructions?: string;
  pharmacy_notes?: string;
  diagnosis_uuid?: string;
}

export default function DiagnosisPrescriptionPage() {
  const router = useRouter();
  const params = useParams();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'prescription'>('diagnosis');

  const [diagnosisForm, setDiagnosisForm] = useState({
    primary_diagnosis: '',
    secondary_diagnoses: '',
    clinical_notes: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: '',
    dosage: '',
    duration: '',
    special_instructions: '',
    pharmacy_notes: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const visitRes = await fetch(`/api/emr/visits/${visitId}`);
        if (!visitRes.ok) throw new Error('Failed to load visit');
        const visitData = await visitRes.json();
        setVisit(visitData.data);

        const diagRes = await fetch(`/api/emr/visits/${visitId}/diagnosis`);
        if (diagRes.ok) {
          const diagData = await diagRes.json();
          if (diagData.data) {
            setDiagnosis(diagData.data);
            setDiagnosisForm({
              primary_diagnosis: diagData.data.primary_diagnosis || '',
              secondary_diagnoses: diagData.data.secondary_diagnoses || '',
              clinical_notes: diagData.data.clinical_notes || '',
            });
          }
        }

        const rxRes = await fetch(`/api/emr/visits/${visitId}/prescription`);
        if (rxRes.ok) {
          const rxData = await rxRes.json();
          if (rxData.data) {
            setPrescription(rxData.data);
            setPrescriptionForm({
              medicines: rxData.data.medicines || '',
              dosage: rxData.data.dosage || '',
              duration: rxData.data.duration || '',
              special_instructions: rxData.data.special_instructions || '',
              pharmacy_notes: rxData.data.pharmacy_notes || '',
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [visitId]);

  const saveDiagnosis = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const method = diagnosis ? 'PUT' : 'POST';
      const res = await fetch(`/api/emr/visits/${visitId}/diagnosis`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...diagnosisForm,
          diagnosis_status: 'DRAFT',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save diagnosis');
      }

      const data = await res.json();
      setDiagnosis(data.data);
      setSuccess('Diagnosis saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save diagnosis');
    } finally {
      setSaving(false);
    }
  };

  const finalizeDiagnosis = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!diagnosis) throw new Error('Create diagnosis first');

      const res = await fetch(`/api/emr/visits/${visitId}/diagnosis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...diagnosisForm,
          diagnosis_status: 'FINALIZED',
        }),
      });

      if (!res.ok) throw new Error('Failed to finalize');

      const data = await res.json();
      setDiagnosis(data.data);
      setSuccess('Diagnosis finalized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize');
    } finally {
      setSaving(false);
    }
  };

  const savePrescription = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const method = prescription ? 'PUT' : 'POST';
      const res = await fetch(`/api/emr/visits/${visitId}/prescription`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prescriptionForm,
          diagnosis_uuid: diagnosis?.id || null,
          prescription_status: 'DRAFT',
        }),
      });

      if (!res.ok) throw new Error('Failed to save prescription');

      const data = await res.json();
      setPrescription(data.data);
      setSuccess('Prescription saved');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const finalizePrescription = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!prescription) throw new Error('Create prescription first');

      const res = await fetch(`/api/emr/visits/${visitId}/prescription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prescriptionForm,
          diagnosis_uuid: diagnosis?.id || null,
          prescription_status: 'FINALIZED',
        }),
      });

      if (!res.ok) throw new Error('Failed to finalize');

      const data = await res.json();
      setPrescription(data.data);
      setSuccess('Prescription finalized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600">Visit not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/doctor/visit/${visitId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to Visit
          </Link>
          <h1 className="text-3xl font-bold mt-2">Diagnosis & Prescription</h1>
          <div className="text-slate-600 mt-1">
            <p className="font-semibold">{visit.visit_number}</p>
            <p className="text-sm">{visit.patient?.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'diagnosis'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Diagnosis
          </button>
          <button
            onClick={() => setActiveTab('prescription')}
            className={`px-6 py-2 rounded-lg font-semibold ${
              activeTab === 'prescription'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Prescription
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'diagnosis' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">Diagnosis</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Primary Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosisForm.primary_diagnosis}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, primary_diagnosis: e.target.value })
                  }
                  disabled={diagnosis?.diagnosis_status === 'FINALIZED'}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Enter primary diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Secondary Diagnoses
                </label>
                <textarea
                  value={diagnosisForm.secondary_diagnoses}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, secondary_diagnoses: e.target.value })
                  }
                  disabled={diagnosis?.diagnosis_status === 'FINALIZED'}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Secondary diagnoses if any"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Clinical Notes
                </label>
                <textarea
                  value={diagnosisForm.clinical_notes}
                  onChange={(e) =>
                    setDiagnosisForm({ ...diagnosisForm, clinical_notes: e.target.value })
                  }
                  disabled={diagnosis?.diagnosis_status === 'FINALIZED'}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Additional clinical notes"
                />
              </div>

              {diagnosis?.diagnosis_status !== 'FINALIZED' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={saveDiagnosis}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    onClick={finalizeDiagnosis}
                    disabled={saving || !diagnosis}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Finalizing...' : 'Finalize'}
                  </button>
                </div>
              )}

              {diagnosis?.diagnosis_status === 'FINALIZED' && (
                <div className="text-center text-slate-600 py-4">
                  <p className="text-sm">Diagnosis finalized and cannot be edited.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescription' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-800">Prescription</h2>
              {diagnosis && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  Linked to diagnosis: <strong>{diagnosis.primary_diagnosis}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Medicines *
                </label>
                <textarea
                  value={prescriptionForm.medicines}
                  onChange={(e) =>
                    setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })
                  }
                  disabled={prescription?.prescription_status === 'DISPENSED'}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="List medicines"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={prescriptionForm.dosage}
                    onChange={(e) =>
                      setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })
                    }
                    disabled={prescription?.prescription_status === 'DISPENSED'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                    placeholder="e.g., 1 tablet twice daily"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
                  <input
                    type="text"
                    value={prescriptionForm.duration}
                    onChange={(e) =>
                      setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })
                    }
                    disabled={prescription?.prescription_status === 'DISPENSED'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={prescriptionForm.special_instructions}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      special_instructions: e.target.value,
                    })
                  }
                  disabled={prescription?.prescription_status === 'DISPENSED'}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="e.g., Take with food, avoid milk"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Pharmacy Notes
                </label>
                <textarea
                  value={prescriptionForm.pharmacy_notes}
                  onChange={(e) =>
                    setPrescriptionForm({ ...prescriptionForm, pharmacy_notes: e.target.value })
                  }
                  disabled={prescription?.prescription_status === 'DISPENSED'}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Notes for pharmacy"
                />
              </div>

              {prescription?.prescription_status !== 'DISPENSED' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={savePrescription}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    onClick={finalizePrescription}
                    disabled={saving || !prescription}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {saving ? 'Finalizing...' : 'Finalize'}
                  </button>
                </div>
              )}

              {prescription?.prescription_status === 'DISPENSED' && (
                <div className="text-center text-slate-600 py-4">
                  <p className="text-sm">Prescription dispensed and cannot be edited.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
