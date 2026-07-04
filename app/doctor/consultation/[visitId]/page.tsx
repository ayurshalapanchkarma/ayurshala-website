'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Visit {
  uuid: string;
  visit_number: string;
  patient_uuid: string;
  chief_complaint?: string;
  patient?: {
    name: string;
    phone: string;
  };
}

interface Consultation {
  id: string;
  visit_uuid: string;
  consultation_status: 'DRAFT' | 'FINALIZED';
  chief_complaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  clinical_examination?: string;
  additional_notes?: string;
  doctor_uuid: string;
  soap_complete: boolean;
}

export default function ConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    clinical_examination: '',
    additional_notes: '',
  });

  // Load visit and consultation
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError('');

        // Get visit details
        const visitRes = await fetch(`/api/emr/visits/${visitId}`);
        if (!visitRes.ok) throw new Error('Failed to load visit');
        const visitData = await visitRes.json();
        setVisit(visitData.data);

        // Get or create consultation
        const consultRes = await fetch(`/api/emr/visits/${visitId}/consultation`);
        if (consultRes.ok) {
          const consultData = await consultRes.json();
          if (consultData.data) {
            setConsultation(consultData.data);
            setFormData({
              subjective: consultData.data.subjective || '',
              objective: consultData.data.objective || '',
              assessment: consultData.data.assessment || '',
              plan: consultData.data.plan || '',
              clinical_examination: consultData.data.clinical_examination || '',
              additional_notes: consultData.data.additional_notes || '',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const method = consultation ? 'PUT' : 'POST';
      const res = await fetch(`/api/emr/visits/${visitId}/consultation`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          consultation_status: 'DRAFT',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save consultation');
      }

      const data = await res.json();
      setConsultation(data.data);
      setSuccess('Consultation saved as draft');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!consultation) {
        setError('Cannot finalize: consultation not created yet');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/emr/visits/${visitId}/consultation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          consultation_status: 'FINALIZED',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to finalize consultation');
      }

      const data = await res.json();
      setConsultation(data.data);
      setSuccess('Consultation finalized successfully');
      setTimeout(() => router.push(`/doctor/visit/${visitId}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize consultation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600">Visit not found</div>
            <Link
              href="/doctor/queue"
              className="text-blue-600 hover:underline mt-4 block"
            >
              Back to Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFinalized = consultation?.consultation_status === 'FINALIZED';
  const canEdit = !isFinalized;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/doctor/visit/${visitId}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Visit
          </Link>
          <h1 className="text-3xl font-bold mt-2">Consultation Notes</h1>
          <div className="text-slate-600 mt-1">
            <p className="font-semibold">{visit.visit_number}</p>
            <p className="text-sm">{visit.patient?.name}</p>
          </div>
        </div>

        {/* Status Alert */}
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
        {isFinalized && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            This consultation is finalized and cannot be edited.
          </div>
        )}

        {/* Form */}
        <form className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Chief Complaint (Display Only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Chief Complaint
            </label>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
              {visit.chief_complaint || '(Not provided)'}
            </div>
          </div>

          {/* SOAP Notes */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">SOAP Notes</h2>

            {/* Subjective */}
            <div className="mb-4">
              <label htmlFor="subjective" className="block text-sm font-semibold text-slate-700 mb-2">
                S - Subjective (Patient History, Symptoms)
              </label>
              <textarea
                id="subjective"
                name="subjective"
                value={formData.subjective}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., Patient reports persistent cough for 2 weeks, worse in mornings..."
              />
            </div>

            {/* Objective */}
            <div className="mb-4">
              <label htmlFor="objective" className="block text-sm font-semibold text-slate-700 mb-2">
                O - Objective (Clinical Findings, Test Results)
              </label>
              <textarea
                id="objective"
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., Chest examination reveals mild wheezing on left side, temperature normal..."
              />
            </div>

            {/* Assessment */}
            <div className="mb-4">
              <label htmlFor="assessment" className="block text-sm font-semibold text-slate-700 mb-2">
                A - Assessment (Clinical Reasoning, Diagnosis)
              </label>
              <textarea
                id="assessment"
                name="assessment"
                value={formData.assessment}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., Probable upper respiratory infection with mild bronchospasm..."
              />
            </div>

            {/* Plan */}
            <div className="mb-6">
              <label htmlFor="plan" className="block text-sm font-semibold text-slate-700 mb-2">
                P - Plan (Treatment Outline)
              </label>
              <textarea
                id="plan"
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="e.g., Prescribe bronchodilator, warm liquids, rest for 3-4 days..."
              />
            </div>
          </div>

          {/* Clinical Examination */}
          <div className="border-t pt-6">
            <label htmlFor="clinical_examination" className="block text-sm font-semibold text-slate-700 mb-2">
              Clinical Examination Details
            </label>
            <textarea
              id="clinical_examination"
              name="clinical_examination"
              value={formData.clinical_examination}
              onChange={handleChange}
              disabled={!canEdit}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Physical examination findings, inspection, palpation, etc."
            />
          </div>

          {/* Additional Notes */}
          <div className="border-t pt-6">
            <label htmlFor="additional_notes" className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes / Flags
            </label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              disabled={!canEdit}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Important allergies, precautions, red flags, etc."
            />
          </div>

          {/* SOAP Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              SOAP Status:{' '}
              <span className="font-semibold">
                {formData.subjective && formData.objective && formData.assessment && formData.plan
                  ? '✅ Complete'
                  : '⏳ Incomplete'}
              </span>
            </p>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 font-semibold"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={finalize}
                disabled={saving || !consultation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {saving ? 'Finalizing...' : 'Finalize Consultation'}
              </button>
            </div>
          )}

          {isFinalized && (
            <div className="text-center text-slate-600 py-4">
              <p className="text-sm">Consultation finalized. Contact admin to modify.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
