import { SupabaseClient } from '@supabase/supabase-js';

export interface AyurvedicAssessmentRequest {
  prakriti?: string | null;
  vikriti?: string | null;
  nadi_description?: string | null;
  sara_assessment?: string | null;
  samhanana_assessment?: string | null;
  pramana_assessment?: string | null;
  satmya_assessment?: string | null;
  satva_level?: string | null;
  ahara_assessment?: string | null;
  vyayama_assessment?: string | null;
  nidra_assessment?: string | null;
  nadi_examination?: string | null;
  mala_examination?: string | null;
  mutra_examination?: string | null;
  jivha_examination?: string | null;
  shabda_examination?: string | null;
  sparsha_examination?: string | null;
  drk_examination?: string | null;
  akriti_examination?: string | null;
  agni_level?: string | null;
  ojas_level?: string | null;
  assessment_summary?: string | null;
  assessment_status?: 'DRAFT' | 'FINALIZED';
}

export interface AyurvedicAssessmentResponse {
  id: string;
  visit_uuid: string;
  assessment_status: 'DRAFT' | 'FINALIZED';
  prakriti?: string | null;
  vikriti?: string | null;
  nadi_description?: string | null;
  sara_assessment?: string | null;
  samhanana_assessment?: string | null;
  pramana_assessment?: string | null;
  satmya_assessment?: string | null;
  satva_level?: string | null;
  ahara_assessment?: string | null;
  vyayama_assessment?: string | null;
  nidra_assessment?: string | null;
  nadi_examination?: string | null;
  mala_examination?: string | null;
  mutra_examination?: string | null;
  jivha_examination?: string | null;
  shabda_examination?: string | null;
  sparsha_examination?: string | null;
  drk_examination?: string | null;
  akriti_examination?: string | null;
  agni_level?: string | null;
  ojas_level?: string | null;
  assessment_summary?: string | null;
  doctor_uuid: string;
  doctor_name?: string;
  created_at: string;
  updated_at: string;
}

export class AyurvedicAssessmentService {
  constructor(private client: SupabaseClient) {}

  async createAssessment(
    visitUuid: string,
    doctorUuid: string,
    req: AyurvedicAssessmentRequest
  ): Promise<AyurvedicAssessmentResponse> {
    const { data: visit, error: visitError } = await this.client
      .from('emr_visit')
      .select('uuid')
      .eq('uuid', visitUuid)
      .single();

    if (visitError || !visit) {
      throw new Error(`Visit not found: ${visitUuid}`);
    }

    const { data: existing, error: existingError } = await this.client
      .from('emr_ayurvedic_assessment')
      .select('id')
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (existing) {
      throw new Error(`Assessment already exists for visit ${visitUuid}`);
    }

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing assessment: ${existingError.message}`);
    }

    const { data, error } = await this.client
      .from('emr_ayurvedic_assessment')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        prakriti: req.prakriti || null,
        vikriti: req.vikriti || null,
        nadi_description: req.nadi_description || null,
        sara_assessment: req.sara_assessment || null,
        samhanana_assessment: req.samhanana_assessment || null,
        pramana_assessment: req.pramana_assessment || null,
        satmya_assessment: req.satmya_assessment || null,
        satva_level: req.satva_level || null,
        ahara_assessment: req.ahara_assessment || null,
        vyayama_assessment: req.vyayama_assessment || null,
        nidra_assessment: req.nidra_assessment || null,
        nadi_examination: req.nadi_examination || null,
        mala_examination: req.mala_examination || null,
        mutra_examination: req.mutra_examination || null,
        jivha_examination: req.jivha_examination || null,
        shabda_examination: req.shabda_examination || null,
        sparsha_examination: req.sparsha_examination || null,
        drk_examination: req.drk_examination || null,
        akriti_examination: req.akriti_examination || null,
        agni_level: req.agni_level || null,
        ojas_level: req.ojas_level || null,
        assessment_summary: req.assessment_summary || null,
        assessment_status: 'DRAFT',
        created_by: doctorUuid,
        updated_by: doctorUuid,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create assessment: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  async getAssessment(visitUuid: string): Promise<AyurvedicAssessmentResponse | null> {
    const { data, error } = await this.client
      .from('emr_ayurvedic_assessment')
      .select(`
        *,
        doctor:profiles(id, name)
      `)
      .eq('visit_uuid', visitUuid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch assessment: ${error.message}`);
    }

    return data ? this.formatResponse(data) : null;
  }

  async updateAssessment(
    visitUuid: string,
    doctorUuid: string,
    req: AyurvedicAssessmentRequest
  ): Promise<AyurvedicAssessmentResponse> {
    const existingAssessment = await this.getAssessment(visitUuid);

    if (!existingAssessment) {
      throw new Error(`Assessment not found for visit: ${visitUuid}`);
    }

    if (existingAssessment.doctor_uuid !== doctorUuid) {
      throw new Error(`Access denied: Only the doctor who created this assessment can edit it`);
    }

    if (existingAssessment.assessment_status === 'FINALIZED') {
      throw new Error(`Cannot edit finalized assessment`);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: doctorUuid,
    };

    if (req.prakriti !== undefined) updateData.prakriti = req.prakriti;
    if (req.vikriti !== undefined) updateData.vikriti = req.vikriti;
    if (req.nadi_description !== undefined) updateData.nadi_description = req.nadi_description;
    if (req.sara_assessment !== undefined) updateData.sara_assessment = req.sara_assessment;
    if (req.samhanana_assessment !== undefined) updateData.samhanana_assessment = req.samhanana_assessment;
    if (req.pramana_assessment !== undefined) updateData.pramana_assessment = req.pramana_assessment;
    if (req.satmya_assessment !== undefined) updateData.satmya_assessment = req.satmya_assessment;
    if (req.satva_level !== undefined) updateData.satva_level = req.satva_level;
    if (req.ahara_assessment !== undefined) updateData.ahara_assessment = req.ahara_assessment;
    if (req.vyayama_assessment !== undefined) updateData.vyayama_assessment = req.vyayama_assessment;
    if (req.nidra_assessment !== undefined) updateData.nidra_assessment = req.nidra_assessment;
    if (req.nadi_examination !== undefined) updateData.nadi_examination = req.nadi_examination;
    if (req.mala_examination !== undefined) updateData.mala_examination = req.mala_examination;
    if (req.mutra_examination !== undefined) updateData.mutra_examination = req.mutra_examination;
    if (req.jivha_examination !== undefined) updateData.jivha_examination = req.jivha_examination;
    if (req.shabda_examination !== undefined) updateData.shabda_examination = req.shabda_examination;
    if (req.sparsha_examination !== undefined) updateData.sparsha_examination = req.sparsha_examination;
    if (req.drk_examination !== undefined) updateData.drk_examination = req.drk_examination;
    if (req.akriti_examination !== undefined) updateData.akriti_examination = req.akriti_examination;
    if (req.agni_level !== undefined) updateData.agni_level = req.agni_level;
    if (req.ojas_level !== undefined) updateData.ojas_level = req.ojas_level;
    if (req.assessment_summary !== undefined) updateData.assessment_summary = req.assessment_summary;
    if (req.assessment_status !== undefined) updateData.assessment_status = req.assessment_status;

    const { data, error } = await this.client
      .from('emr_ayurvedic_assessment')
      .update(updateData)
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update assessment: ${error.message}`);
    }

    return this.formatResponse(data);
  }

  async listDoctorAssessments(
    doctorUuid: string,
    status?: 'DRAFT' | 'FINALIZED'
  ): Promise<AyurvedicAssessmentResponse[]> {
    let query = this.client
      .from('emr_ayurvedic_assessment')
      .select(`
        *,
        doctor:profiles(id, name)
      `)
      .eq('doctor_uuid', doctorUuid)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('assessment_status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list assessments: ${error.message}`);
    }

    return data.map((item) => this.formatResponse(item));
  }

  private formatResponse(data: any): AyurvedicAssessmentResponse {
    const doctorData = data.doctor || {};
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      assessment_status: data.assessment_status,
      prakriti: data.prakriti,
      vikriti: data.vikriti,
      nadi_description: data.nadi_description,
      sara_assessment: data.sara_assessment,
      samhanana_assessment: data.samhanana_assessment,
      pramana_assessment: data.pramana_assessment,
      satmya_assessment: data.satmya_assessment,
      satva_level: data.satva_level,
      ahara_assessment: data.ahara_assessment,
      vyayama_assessment: data.vyayama_assessment,
      nidra_assessment: data.nidra_assessment,
      nadi_examination: data.nadi_examination,
      mala_examination: data.mala_examination,
      mutra_examination: data.mutra_examination,
      jivha_examination: data.jivha_examination,
      shabda_examination: data.shabda_examination,
      sparsha_examination: data.sparsha_examination,
      drk_examination: data.drk_examination,
      akriti_examination: data.akriti_examination,
      agni_level: data.agni_level,
      ojas_level: data.ojas_level,
      assessment_summary: data.assessment_summary,
      doctor_uuid: data.doctor_uuid,
      doctor_name: typeof doctorData === 'object' ? doctorData?.name : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
