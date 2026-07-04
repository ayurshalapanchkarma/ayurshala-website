// Lazy load Supabase client only when needed (for build-time safety)
let supabaseClient: any = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

// Types
interface TreatmentPlanRequest {
  panchakarma_type: string;
  total_sessions: number;
  session_duration_minutes: number;
  frequency: string;
  start_date?: string;
  end_date?: string;
  treatment_objectives?: string;
  special_precautions?: string;
  treatment_plan_status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface TreatmentPlanResponse {
  id: string;
  visit_uuid: string;
  treatment_plan_status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  panchakarma_type: string;
  total_sessions: number;
  session_duration_minutes: number;
  frequency: string;
  start_date?: string;
  end_date?: string;
  treatment_objectives?: string;
  special_precautions?: string;
  doctor_uuid: string;
  created_at: string;
}

interface TherapySessionRequest {
  session_number: number;
  scheduled_date: string;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  duration_minutes?: number;
  therapist_uuid?: string;
  therapist_name?: string;
  oils_medicines_used?: string;
  quantity?: string;
  temperature?: string;
  patient_response?: string;
  observations?: string;
  complications_if_any?: string;
  follow_up_notes?: string;
  therapy_session_status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface TherapySessionResponse {
  id: string;
  visit_uuid: string;
  treatment_plan_uuid: string;
  therapy_session_status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  session_number: number;
  scheduled_date: string;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  duration_minutes?: number;
  therapist_uuid?: string;
  therapist_name?: string;
  oils_medicines_used?: string;
  quantity?: string;
  temperature?: string;
  patient_response?: string;
  observations?: string;
  complications_if_any?: string;
  follow_up_notes?: string;
  created_at: string;
}

export class TreatmentPlanService {
  async create(visitUuid: string, doctorUuid: string, req: TreatmentPlanRequest): Promise<TreatmentPlanResponse> {
    if (!req.panchakarma_type || !req.total_sessions || !req.session_duration_minutes || !req.frequency) {
      throw new Error('Missing required fields: panchakarma_type, total_sessions, session_duration_minutes, frequency');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_treatment_plan')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        created_by: doctorUuid,
        updated_by: doctorUuid,
        panchakarma_type: req.panchakarma_type,
        total_sessions: req.total_sessions,
        session_duration_minutes: req.session_duration_minutes,
        frequency: req.frequency,
        start_date: req.start_date || null,
        end_date: req.end_date || null,
        treatment_objectives: req.treatment_objectives || null,
        special_precautions: req.special_precautions || null,
        treatment_plan_status: 'DRAFT',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create treatment plan: ${error.message}`);
    return this.formatResponse(data);
  }

  async get(visitUuid: string): Promise<TreatmentPlanResponse | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_treatment_plan')
      .select('*')
      .eq('visit_uuid', visitUuid)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch treatment plan: ${error.message}`);
    return data ? this.formatResponse(data) : null;
  }

  async update(visitUuid: string, doctorUuid: string, req: TreatmentPlanRequest): Promise<TreatmentPlanResponse> {
    const existing = await this.get(visitUuid);
    if (!existing) throw new Error('Treatment plan not found');

    if (existing.treatment_plan_status === 'COMPLETED' || existing.treatment_plan_status === 'CANCELLED') {
      throw new Error(`Cannot update ${existing.treatment_plan_status} treatment plan`);
    }

    if (existing.doctor_uuid !== doctorUuid) {
      throw new Error('Unauthorized: only the creator can edit this treatment plan');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_treatment_plan')
      .update({
        panchakarma_type: req.panchakarma_type || existing.panchakarma_type,
        total_sessions: req.total_sessions || existing.total_sessions,
        session_duration_minutes: req.session_duration_minutes || existing.session_duration_minutes,
        frequency: req.frequency || existing.frequency,
        start_date: req.start_date !== undefined ? req.start_date : existing.start_date,
        end_date: req.end_date !== undefined ? req.end_date : existing.end_date,
        treatment_objectives: req.treatment_objectives !== undefined ? req.treatment_objectives : existing.treatment_objectives,
        special_precautions: req.special_precautions !== undefined ? req.special_precautions : existing.special_precautions,
        treatment_plan_status: req.treatment_plan_status || existing.treatment_plan_status,
        updated_by: doctorUuid,
        updated_at: new Date().toISOString(),
      })
      .eq('visit_uuid', visitUuid)
      .select()
      .single();

    if (error) throw new Error(`Failed to update treatment plan: ${error.message}`);
    return this.formatResponse(data);
  }

  private formatResponse(data: any): TreatmentPlanResponse {
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      treatment_plan_status: data.treatment_plan_status,
      panchakarma_type: data.panchakarma_type,
      total_sessions: data.total_sessions,
      session_duration_minutes: data.session_duration_minutes,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date,
      treatment_objectives: data.treatment_objectives,
      special_precautions: data.special_precautions,
      doctor_uuid: data.doctor_uuid,
      created_at: data.created_at,
    };
  }
}

export class TherapySessionService {
  async create(
    visitUuid: string,
    treatmentPlanUuid: string,
    createdByUuid: string,
    req: TherapySessionRequest
  ): Promise<TherapySessionResponse> {
    if (!req.session_number || !req.scheduled_date) {
      throw new Error('Missing required fields: session_number, scheduled_date');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_therapy_session')
      .insert({
        visit_uuid: visitUuid,
        treatment_plan_uuid: treatmentPlanUuid,
        created_by: createdByUuid,
        session_number: req.session_number,
        scheduled_date: req.scheduled_date,
        scheduled_time: req.scheduled_time || null,
        actual_start_time: req.actual_start_time || null,
        actual_end_time: req.actual_end_time || null,
        duration_minutes: req.duration_minutes || null,
        therapist_uuid: req.therapist_uuid || null,
        therapist_name: req.therapist_name || null,
        oils_medicines_used: req.oils_medicines_used || null,
        quantity: req.quantity || null,
        temperature: req.temperature || null,
        patient_response: req.patient_response || null,
        observations: req.observations || null,
        complications_if_any: req.complications_if_any || null,
        follow_up_notes: req.follow_up_notes || null,
        therapy_session_status: 'SCHEDULED',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create therapy session: ${error.message}`);
    return this.formatResponse(data);
  }

  async get(sessionUuid: string): Promise<TherapySessionResponse | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_therapy_session')
      .select('*')
      .eq('id', sessionUuid)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch therapy session: ${error.message}`);
    return data ? this.formatResponse(data) : null;
  }

  async list(treatmentPlanUuid: string): Promise<TherapySessionResponse[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_therapy_session')
      .select('*')
      .eq('treatment_plan_uuid', treatmentPlanUuid)
      .order('session_number', { ascending: true });

    if (error) throw new Error(`Failed to list therapy sessions: ${error.message}`);
    return (data || []).map((session) => this.formatResponse(session));
  }

  async update(sessionUuid: string, createdByUuid: string, req: TherapySessionRequest): Promise<TherapySessionResponse> {
    const existing = await this.get(sessionUuid);
    if (!existing) throw new Error('Therapy session not found');

    if (existing.therapy_session_status === 'COMPLETED' || existing.therapy_session_status === 'CANCELLED') {
      throw new Error(`Cannot update ${existing.therapy_session_status} session`);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_therapy_session')
      .update({
        scheduled_date: req.scheduled_date || existing.scheduled_date,
        scheduled_time: req.scheduled_time !== undefined ? req.scheduled_time : existing.scheduled_time,
        actual_start_time: req.actual_start_time !== undefined ? req.actual_start_time : existing.actual_start_time,
        actual_end_time: req.actual_end_time !== undefined ? req.actual_end_time : existing.actual_end_time,
        duration_minutes: req.duration_minutes !== undefined ? req.duration_minutes : existing.duration_minutes,
        therapist_uuid: req.therapist_uuid !== undefined ? req.therapist_uuid : existing.therapist_uuid,
        therapist_name: req.therapist_name !== undefined ? req.therapist_name : existing.therapist_name,
        oils_medicines_used: req.oils_medicines_used !== undefined ? req.oils_medicines_used : existing.oils_medicines_used,
        quantity: req.quantity !== undefined ? req.quantity : existing.quantity,
        temperature: req.temperature !== undefined ? req.temperature : existing.temperature,
        patient_response: req.patient_response !== undefined ? req.patient_response : existing.patient_response,
        observations: req.observations !== undefined ? req.observations : existing.observations,
        complications_if_any: req.complications_if_any !== undefined ? req.complications_if_any : existing.complications_if_any,
        follow_up_notes: req.follow_up_notes !== undefined ? req.follow_up_notes : existing.follow_up_notes,
        therapy_session_status: req.therapy_session_status || existing.therapy_session_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionUuid)
      .select()
      .single();

    if (error) throw new Error(`Failed to update therapy session: ${error.message}`);
    return this.formatResponse(data);
  }

  private formatResponse(data: any): TherapySessionResponse {
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      treatment_plan_uuid: data.treatment_plan_uuid,
      therapy_session_status: data.therapy_session_status,
      session_number: data.session_number,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      actual_start_time: data.actual_start_time,
      actual_end_time: data.actual_end_time,
      duration_minutes: data.duration_minutes,
      therapist_uuid: data.therapist_uuid,
      therapist_name: data.therapist_name,
      oils_medicines_used: data.oils_medicines_used,
      quantity: data.quantity,
      temperature: data.temperature,
      patient_response: data.patient_response,
      observations: data.observations,
      complications_if_any: data.complications_if_any,
      follow_up_notes: data.follow_up_notes,
      created_at: data.created_at,
    };
  }
}
