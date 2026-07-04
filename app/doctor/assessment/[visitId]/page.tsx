'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Visit {
  uuid: string;
  visit_number: string;
  patient?: {
    name: string;
  };
}

interface Assessment {
  id: string;
  visit_uuid: string;
  assessment_status: 'DRAFT' | 'FINALIZED';
  prakriti?: string;
  vikriti?: string;
  nadi_description?: string;
  sara_assessment?: string;
  samhanana_assessment?: string;
  pramana_assessment?: string;
  satmya_assessment?: string;
  satva_level?: string;
  ahara_assessment?: string;
  vyayama_assessment?: string;
  nidra_assessment?: string;
  nadi_examination?: string;
  mala_examination?: string;
  mutra_examination?: string;
  jivha_examination?: string;
  shabda_examination?: string;
  sparsha_examination?: string;
  drk_examination?: string;
  akriti_examination?: string;
  agni_level?: string;
  ojas_level?: string;
  assessment_summary?: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const visitId = params.visitId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    prakriti: '',
    vikriti: '',
    nadi_description: '',
    sara_assessment: '',
    samhanana_assessment: '',
    pramana_assessment: '',
    satmya_assessment: '',
    satva_level: '',
    ahara_assessment: '',
    vyayama_assessment: '',
    nidra_assessment: '',
    nadi_examination: '',
    mala_examination: '',
    mutra_examination: '',
    jivha_examination: '',
    shabda_examination: '',
    sparsha_examination: '',
    drk_examination: '',
    akriti_examination: '',
    agni_level: '',
    ojas_level: '',
    assessment_summary: '',
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

        const assessRes = await fetch(`/api/emr/visits/${visitId}/assessment`);
        if (assessRes.ok) {
          const assessData = await assessRes.json();
          if (assessData.data) {
            setAssessment(assessData.data);
            setFormData({
              prakriti: assessData.data.prakriti || '',
              vikriti: assessData.data.vikriti || '',
              nadi_description: assessData.data.nadi_description || '',
              sara_assessment: assessData.data.sara_assessment || '',
              samhanana_assessment: assessData.data.samhanana_assessment || '',
              pramana_assessment: assessData.data.pramana_assessment || '',
              satmya_assessment: assessData.data.satmya_assessment || '',
              satva_level: assessData.data.satva_level || '',
              ahara_assessment: assessData.data.ahara_assessment || '',
              vyayama_assessment: assessData.data.vyayama_assessment || '',
              nidra_assessment: assessData.data.nidra_assessment || '',
              nadi_examination: assessData.data.nadi_examination || '',
              mala_examination: assessData.data.mala_examination || '',
              mutra_examination: assessData.data.mutra_examination || '',
              jivha_examination: assessData.data.jivha_examination || '',
              shabda_examination: assessData.data.shabda_examination || '',
              sparsha_examination: assessData.data.sparsha_examination || '',
              drk_examination: assessData.data.drk_examination || '',
              akriti_examination: assessData.data.akriti_examination || '',
              agni_level: assessData.data.agni_level || '',
              ojas_level: assessData.data.ojas_level || '',
              assessment_summary: assessData.data.assessment_summary || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

      const method = assessment ? 'PUT' : 'POST';
      const res = await fetch(`/api/emr/visits/${visitId}/assessment`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assessment_status: 'DRAFT',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save assessment');
      }

      const data = await res.json();
      setAssessment(data.data);
      setSuccess('Assessment saved as draft');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!assessment) {
        setError('Cannot finalize: assessment not created yet');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/emr/visits/${visitId}/assessment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assessment_status: 'FINALIZED',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to finalize assessment');
      }

      const data = await res.json();
      setAssessment(data.data);
      setSuccess('Assessment finalized');
      setTimeout(() => router.push(`/doctor/visit/${visitId}`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize assessment');
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
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
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

  const isFinalized = assessment?.assessment_status === 'FINALIZED';
  const canEdit = !isFinalized;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/doctor/visit/${visitId}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Visit
          </Link>
          <h1 className="text-3xl font-bold mt-2">Ayurvedic Assessment</h1>
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
        {isFinalized && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            This assessment is finalized and cannot be edited.
          </div>
        )}

        <form className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Constitution & Imbalance */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Constitution & Imbalance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Prakriti</label>
                <textarea
                  name="prakriti"
                  value={formData.prakriti}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Original constitution"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vikriti</label>
                <textarea
                  name="vikriti"
                  value={formData.vikriti}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Current imbalance"
                />
              </div>
            </div>
          </div>

          {/* Pariksha Assessments */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Pariksha (Diagnostic Methods)</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nadi Pariksha</label>
              <textarea
                name="nadi_description"
                value={formData.nadi_description}
                onChange={handleChange}
                disabled={!canEdit}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                placeholder="Pulse assessment findings"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sara</label>
                <textarea
                  name="sara_assessment"
                  value={formData.sara_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Tissue quality"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Samhanana</label>
                <textarea
                  name="samhanana_assessment"
                  value={formData.samhanana_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Body structure"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pramana</label>
                <textarea
                  name="pramana_assessment"
                  value={formData.pramana_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Body measurements"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Satmya</label>
                <textarea
                  name="satmya_assessment"
                  value={formData.satmya_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Dietary compatibility"
                />
              </div>
            </div>
          </div>

          {/* Functional Assessments */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Functional Assessments</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Satva</label>
                <textarea
                  name="satva_level"
                  value={formData.satva_level}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Mental clarity"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Agni</label>
                <textarea
                  name="agni_level"
                  value={formData.agni_level}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Digestive fire"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ojas</label>
                <textarea
                  name="ojas_level"
                  value={formData.ojas_level}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  placeholder="Vital essence"
                />
              </div>
            </div>
          </div>

          {/* Ashtavidha Examination */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Ashtavidha Pariksha (8-fold Examination)</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'nadi_examination', label: 'Nadi (Pulse)' },
                { key: 'mala_examination', label: 'Mala (Elimination)' },
                { key: 'mutra_examination', label: 'Mutra (Urine)' },
                { key: 'jivha_examination', label: 'Jivha (Tongue)' },
                { key: 'shabda_examination', label: 'Shabda (Voice)' },
                { key: 'sparsha_examination', label: 'Sparsha (Touch)' },
                { key: 'drk_examination', label: 'Drk (Eyes)' },
                { key: 'akriti_examination', label: 'Akriti (Form)' },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{item.label}</label>
                  <textarea
                    name={item.key}
                    value={formData[item.key as keyof typeof formData]}
                    onChange={handleChange}
                    disabled={!canEdit}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dashavidha Remaining */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Dashavidha Pariksha (Additional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ahara (Digestion)</label>
                <textarea
                  name="ahara_assessment"
                  value={formData.ahara_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vyayama (Exercise)</label>
                <textarea
                  name="vyayama_assessment"
                  value={formData.vyayama_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nidra (Sleep)</label>
                <textarea
                  name="nidra_assessment"
                  value={formData.nidra_assessment}
                  onChange={handleChange}
                  disabled={!canEdit}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Assessment Summary */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Assessment Summary</label>
            <textarea
              name="assessment_summary"
              value={formData.assessment_summary}
              onChange={handleChange}
              disabled={!canEdit}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
              placeholder="Clinical observations and summary"
            />
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
                disabled={saving || !assessment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {saving ? 'Finalizing...' : 'Finalize Assessment'}
              </button>
            </div>
          )}

          {isFinalized && (
            <div className="text-center text-slate-600 py-4">
              <p className="text-sm">Assessment finalized and cannot be edited.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
