import { SupabaseClient } from '@supabase/supabase-js';

export interface DiagnosisRequest {
  primary_diagnosis: string;
  secondary_diagnoses?: string | null;
  clinical_notes?: string | null;
  diagnosis_status?: 'DRAFT' | 'FINALIZED';
}

export interface DiagnosisResponse {
  id: string;
  visit_uuid: string;
  diagnosis_status: 'DRAFT' | 'FINALIZED';
  primary_diagnosis: string;
  secondary_diagnoses?: string | null;
  clinical_notes?: string | null;
  doctor_uuid: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionRequest {
  medicines: string;
  dosage?: string | null;
  duration?: string | null;
  special_instructions?: string | null;
  pharmacy_notes?: string | null;
  diagnosis_uuid?: string | null;
  prescription_status?: 'DRAFT' | 'FINALIZED' | 'DISPENSED';
}

export interface PrescriptionResponse {
  id: string;
  visit_uuid: string;
  diagnosis_uuid?: string | null;
  prescription_status: 'DRAFT' | 'FINALIZED' | 'DISPENSED';
  medicines: string;
  dosage?: string | null;
  duration?: string | null;
  special_instructions?: string | null;
  pharmacy_notes?: string | null;
  doctor_uuid: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
}

export class DiagnosisService {
  constructor(private client: SupabaseClient) {}

  async createDiagnosis(
    visitUuid: string,
    doctorUuid: string,
    req: DiagnosisRequest
  ): Promise<DiagnosisResponse> {
    const { data: visit, error: visitError } = await this.client
      .from('emr_visit')
      .select('uuid')
      .eq('uuid', visitUuid)
      .single();

    if (visitError || !visit) {
      throw new Error(`Visit not found: ${visitUuid}`);
    }

    const { data: existing, error: existingError } = await this.client
      .from('emr_diagnosis')
      .select('id')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (existing) {
      throw new Error(`Diagnosis already exists for visit ${visitUuid}`);
    }

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing diagnosis: ${existingError.message}`);
    }

    const { data, error } = await this.client
      .from('emr_diagnosis')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        primary_diagnosis: req.primary_diagnosis,
        secondary_diagnoses: req.secondary_diagnoses || null,
        clinical_notes: req.clinical_notes || null,
        diagnosis_status: 'DRAFT',
        created_by: doctorUuid,
        updated_by: doctorUuid,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create diagnosis: ${error.message}`);
    }

    return this.formatDiagnosisResponse(data);
  }

  async getDiagnosis(visitUuid: string): Promise<DiagnosisResponse | null> {
    const { data, error } = await this.client
      .from('emr_diagnosis')
      .select('*,doctor:profiles(id, name)')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch diagnosis: ${error.message}`);
    }

    return data ? this.formatDiagnosisResponse(data) : null;
  }

  async updateDiagnosis(
    visitUuid: string,
    doctorUuid: string,
    req: DiagnosisRequest
  ): Promise<DiagnosisResponse> {
    const existing = await this.getDiagnosis(visitUuid);

    if (!existing) {
      throw new Error(`Diagnosis not found for visit: ${visitUuid}`);
    }

    if (existing.doctor_uuid !== doctorUuid) {
      throw new Error(`Access denied`);
    }

    if (existing.diagnosis_status === 'FINALIZED') {
      throw new Error(`Cannot edit finalized diagnosis`);
    }

    const { data, error } = await this.client
      .from('emr_diagnosis')
      .update({
        primary_diagnosis: req.primary_diagnosis,
        secondary_diagnoses: req.secondary_diagnoses ?? existing.secondary_diagnoses,
        clinical_notes: req.clinical_notes ?? existing.clinical_notes,
        diagnosis_status: req.diagnosis_status ?? existing.diagnosis_status,
        updated_at: new Date().toISOString(),
        updated_by: doctorUuid,
      })
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update diagnosis: ${error.message}`);
    }

    return this.formatDiagnosisResponse(data);
  }

  private formatDiagnosisResponse(data: any): DiagnosisResponse {
    const doctorData = data.doctor || {};
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      diagnosis_status: data.diagnosis_status,
      primary_diagnosis: data.primary_diagnosis,
      secondary_diagnoses: data.secondary_diagnoses,
      clinical_notes: data.clinical_notes,
      doctor_uuid: data.doctor_uuid,
      doctor_name: typeof doctorData === 'object' ? doctorData?.name : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}

export class PrescriptionService {
  constructor(private client: SupabaseClient) {}

  async createPrescription(
    visitUuid: string,
    doctorUuid: string,
    req: PrescriptionRequest
  ): Promise<PrescriptionResponse> {
    const { data: visit, error: visitError } = await this.client
      .from('emr_visit')
      .select('uuid')
      .eq('uuid', visitUuid)
      .single();

    if (visitError || !visit) {
      throw new Error(`Visit not found: ${visitUuid}`);
    }

    const { data: existing, error: existingError } = await this.client
      .from('emr_prescription')
      .select('id')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (existing) {
      throw new Error(`Prescription already exists for visit ${visitUuid}`);
    }

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing prescription: ${existingError.message}`);
    }

    const { data, error } = await this.client
      .from('emr_prescription')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        diagnosis_uuid: req.diagnosis_uuid || null,
        medicines: req.medicines,
        dosage: req.dosage || null,
        duration: req.duration || null,
        special_instructions: req.special_instructions || null,
        pharmacy_notes: req.pharmacy_notes || null,
        prescription_status: 'DRAFT',
        created_by: doctorUuid,
        updated_by: doctorUuid,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create prescription: ${error.message}`);
    }

    return this.formatPrescriptionResponse(data);
  }

  async getPrescription(visitUuid: string): Promise<PrescriptionResponse | null> {
    const { data, error } = await this.client
      .from('emr_prescription')
      .select('*,doctor:profiles(id, name)')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch prescription: ${error.message}`);
    }

    return data ? this.formatPrescriptionResponse(data) : null;
  }

  async updatePrescription(
    visitUuid: string,
    doctorUuid: string,
    req: PrescriptionRequest
  ): Promise<PrescriptionResponse> {
    const existing = await this.getPrescription(visitUuid);

    if (!existing) {
      throw new Error(`Prescription not found for visit: ${visitUuid}`);
    }

    if (existing.doctor_uuid !== doctorUuid) {
      throw new Error(`Access denied`);
    }

    if (existing.prescription_status === 'DISPENSED') {
      throw new Error(`Cannot edit dispensed prescription`);
    }

    const { data, error } = await this.client
      .from('emr_prescription')
      .update({
        medicines: req.medicines,
        dosage: req.dosage ?? existing.dosage,
        duration: req.duration ?? existing.duration,
        special_instructions: req.special_instructions ?? existing.special_instructions,
        pharmacy_notes: req.pharmacy_notes ?? existing.pharmacy_notes,
        prescription_status: req.prescription_status ?? existing.prescription_status,
        updated_at: new Date().toISOString(),
        updated_by: doctorUuid,
      })
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update prescription: ${error.message}`);
    }

    return this.formatPrescriptionResponse(data);
  }

  private formatPrescriptionResponse(data: any): PrescriptionResponse {
    const doctorData = data.doctor || {};
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      diagnosis_uuid: data.diagnosis_uuid,
      prescription_status: data.prescription_status,
      medicines: data.medicines,
      dosage: data.dosage,
      duration: data.duration,
      special_instructions: data.special_instructions,
      pharmacy_notes: data.pharmacy_notes,
      doctor_uuid: data.doctor_uuid,
      doctor_name: typeof doctorData === 'object' ? doctorData?.name : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
