import { SupabaseClient } from '@supabase/supabase-js';

export interface ConsultationRequest {
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  clinical_examination?: string | null;
  additional_notes?: string | null;
  consultation_status?: 'DRAFT' | 'FINALIZED';
}

export interface ConsultationResponse {
  id: string;
  visit_uuid: string;
  consultation_status: 'DRAFT' | 'FINALIZED';
  chief_complaint?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  clinical_examination?: string | null;
  additional_notes?: string | null;
  doctor_uuid: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
  soap_complete: boolean;
}

/**
 * ConsultationService
 * Manages consultation records linked to visits
 * Handles SOAP notes (Subjective, Objective, Assessment, Plan)
 * One consultation per visit, only original doctor can edit
 */
export class ConsultationService {
  constructor(private client: SupabaseClient) {}

  /**
   * Create a new consultation for a visit
   * @param visitUuid - UUID of the visit
   * @param doctorUuid - UUID of the doctor
   * @param req - Consultation request data
   * @returns Created consultation
   */
  async createConsultation(
    visitUuid: string,
    doctorUuid: string,
    req: ConsultationRequest
  ): Promise<ConsultationResponse> {
    // Verify visit exists and get chief complaint
    const { data: visit, error: visitError } = await this.client
      .from('emr_visit')
      .select('uuid, chief_complaint, patient_uuid')
      .eq('uuid', visitUuid)
      .single();

    if (visitError || !visit) {
      throw new Error(`Visit not found: ${visitUuid}`);
    }

    // Check if consultation already exists
    const { data: existing, error: existingError } = await this.client
      .from('emr_consultation')
      .select('id')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `Consultation already exists for visit ${visitUuid}. Use update instead.`
      );
    }

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing consultation: ${existingError.message}`);
    }

    // Create consultation
    const { data, error } = await this.client
      .from('emr_consultation')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        chief_complaint: visit.chief_complaint,
        subjective: req.subjective || null,
        objective: req.objective || null,
        assessment: req.assessment || null,
        plan: req.plan || null,
        clinical_examination: req.clinical_examination || null,
        additional_notes: req.additional_notes || null,
        consultation_status: 'DRAFT',
        created_by: doctorUuid,
        updated_by: doctorUuid,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create consultation: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  /**
   * Get consultation for a visit
   * @param visitUuid - UUID of the visit
   * @returns Consultation or null if not created
   */
  async getConsultation(visitUuid: string): Promise<ConsultationResponse | null> {
    const { data, error } = await this.client
      .from('emr_consultation')
      .select(`
        *,
        doctor:profiles(id, name)
      `)
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch consultation: ${error.message}`);
    }

    return data ? this.formatResponse(data) : null;
  }

  /**
   * Update consultation for a visit
   * @param visitUuid - UUID of the visit
   * @param doctorUuid - UUID of the doctor (must be original creator)
   * @param req - Partial consultation data
   * @returns Updated consultation
   */
  async updateConsultation(
    visitUuid: string,
    doctorUuid: string,
    req: ConsultationRequest
  ): Promise<ConsultationResponse> {
    // Get existing consultation
    const existingConsultation = await this.getConsultation(visitUuid);

    if (!existingConsultation) {
      throw new Error(`Consultation not found for visit: ${visitUuid}`);
    }

    // Check ownership
    if (existingConsultation.doctor_uuid !== doctorUuid) {
      throw new Error(
        `Access denied: Only the doctor who created this consultation can edit it`
      );
    }

    // Check if finalized
    if (existingConsultation.consultation_status === 'FINALIZED') {
      throw new Error(`Cannot edit finalized consultation. Contact admin to modify.`);
    }

    // Update consultation
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: doctorUuid,
    };

    // Only update fields that are provided
    if (req.subjective !== undefined) updateData.subjective = req.subjective;
    if (req.objective !== undefined) updateData.objective = req.objective;
    if (req.assessment !== undefined) updateData.assessment = req.assessment;
    if (req.plan !== undefined) updateData.plan = req.plan;
    if (req.clinical_examination !== undefined)
      updateData.clinical_examination = req.clinical_examination;
    if (req.additional_notes !== undefined)
      updateData.additional_notes = req.additional_notes;
    if (req.consultation_status !== undefined)
      updateData.consultation_status = req.consultation_status;

    const { data, error } = await this.client
      .from('emr_consultation')
      .update(updateData)
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update consultation: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  /**
   * List consultations for a doctor
   * @param doctorUuid - UUID of the doctor
   * @param status - Optional filter by status (DRAFT, FINALIZED)
   * @returns List of consultations with visit details
   */
  async listDoctorConsultations(
    doctorUuid: string,
    status?: 'DRAFT' | 'FINALIZED'
  ): Promise<ConsultationResponse[]> {
    let query = this.client
      .from('emr_consultation')
      .select(`
        *,
        visit:emr_visit(
          uuid,
          visit_number,
          patient_uuid,
          visit_status,
          checked_in_at,
          patient:patients(name, phone)
        )
      `)
      .eq('doctor_uuid', doctorUuid)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('consultation_status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list consultations: ${error.message}`);
    }

    return data.map((item) => this.formatResponse(item));
  }

  /**
   * Get SOAP completion status
   * @param consultationResponse - Consultation response object
   * @returns Boolean indicating if all SOAP fields are filled
   */
  soapIsComplete(consultation: ConsultationResponse): boolean {
    return Boolean(
      consultation.subjective &&
        consultation.objective &&
        consultation.assessment &&
        consultation.plan
    );
  }

  /**
   * Format consultation data for API response
   */
  private formatResponse(data: any): ConsultationResponse {
    const doctorData = data.doctor || {};
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      consultation_status: data.consultation_status,
      chief_complaint: data.chief_complaint,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      clinical_examination: data.clinical_examination,
      additional_notes: data.additional_notes,
      doctor_uuid: data.doctor_uuid,
      doctor_name: typeof doctorData === 'object' ? doctorData?.name : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      soap_complete: Boolean(
        data.subjective && data.objective && data.assessment && data.plan
      ),
    };
  }
}
