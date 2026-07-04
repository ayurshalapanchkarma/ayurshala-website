'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CheckInFormData {
  patient_search: string;
  doctor_uuid: string;
  visit_type: string;
  chief_complaint: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface Doctor {
  id: string;
  name: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CheckInFormData>({
    patient_search: '',
    doctor_uuid: '',
    visit_type: 'OPD',
    chief_complaint: ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Search for patients
  const handlePatientSearch = useCallback(async (query: string) => {
    setFormData(prev => ({ ...prev, patient_search: query }));

    if (query.length < 2) {
      setPatients([]);
      setShowPatientDropdown(false);
      return;
    }

    try {
      const res = await fetch(`/api/pharmacy/patients/search?q=${encodeURIComponent(query)}`);
      const result = await res.json();
      setPatients(result.data || []);
      setShowPatientDropdown(true);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Failed to search patients');
    }
  }, []);

  // Select a patient from dropdown
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_search: patient.name }));
    setShowPatientDropdown(false);
  };

  // Load doctors on mount
  const loadDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/doctors');
      const result = await res.json();
      setDoctors(result.data || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  }, []);

  // Submit check-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedPatient) {
        setError('Please select a patient');
        setLoading(false);
        return;
      }

      if (!formData.doctor_uuid) {
        setError('Please select a doctor');
        setLoading(false);
        return;
      }

      // Create visit
      const res = await fetch('/api/emr/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_uuid: selectedPatient.id,
          doctor_uuid: formData.doctor_uuid,
          visit_date: new Date().toISOString().split('T')[0],
          visit_type: formData.visit_type,
          chief_complaint: formData.chief_complaint,
          created_by: 'current-user-id' // TODO: Get from auth context
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create visit');
      }

      const { data: visit } = await res.json();

      // Redirect to vitals entry page
      router.push(`/reception/vitals/${visit.uuid}`);
    } catch (err) {
      console.error('Error during check-in:', err);
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Patient Check-In</h1>
        <p className="text-gray-600 mb-8">Start a new visit</p>

        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.patient_search}
                onChange={(e) => handlePatientSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <p className="text-sm text-green-600 mt-2">✓ {selectedPatient.name} selected</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            <select
              value={formData.doctor_uuid}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor_uuid: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              onFocus={loadDoctors}
            >
              <option value="">Select a doctor...</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Type
            </label>
            <select
              value={formData.visit_type}
              onChange={(e) => setFormData(prev => ({ ...prev, visit_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="OPD">Out-Patient (OPD)</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint
            </label>
            <textarea
              value={formData.chief_complaint}
              onChange={(e) => setFormData(prev => ({ ...prev, chief_complaint: e.target.value }))}
              placeholder="Patient's main concern..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Checking In...' : 'Check In & Record Vitals'}
          </button>
        </form>
      </div>
    </div>
  );
}
