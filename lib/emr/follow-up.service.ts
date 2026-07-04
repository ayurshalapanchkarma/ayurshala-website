// Lazy load Supabase client only when needed
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
interface FollowUpRequest {
  recommended_date: string;
  recommended_time?: string;
  follow_up_type: string;
  instructions?: string;
  notes?: string;
  follow_up_status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface FollowUpResponse {
  id: string;
  visit_uuid: string;
  follow_up_status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  recommended_date: string;
  recommended_time?: string;
  follow_up_type: string;
  instructions?: string;
  notes?: string;
  completed_at?: string;
  completion_notes?: string;
  doctor_uuid: string;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  visit_uuid: string;
  event_type: string;
  title: string;
  description: string;
  actor_uuid: string;
  metadata: any;
  created_at: string;
}

export class FollowUpService {
  async create(visitUuid: string, doctorUuid: string, req: FollowUpRequest): Promise<FollowUpResponse> {
    if (!req.recommended_date || !req.follow_up_type) {
      throw new Error('Missing required fields: recommended_date, follow_up_type');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_follow_up')
      .insert({
        visit_uuid: visitUuid,
        doctor_uuid: doctorUuid,
        created_by: doctorUuid,
        updated_by: doctorUuid,
        recommended_date: req.recommended_date,
        recommended_time: req.recommended_time || null,
        follow_up_type: req.follow_up_type,
        instructions: req.instructions || null,
        notes: req.notes || null,
        follow_up_status: 'SCHEDULED',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create follow-up: ${error.message}`);
    return this.formatResponse(data);
  }

  async get(followUpUuid: string): Promise<FollowUpResponse | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_follow_up')
      .select('*')
      .eq('id', followUpUuid)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch follow-up: ${error.message}`);
    return data ? this.formatResponse(data) : null;
  }

  async list(visitUuid: string): Promise<FollowUpResponse[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_follow_up')
      .select('*')
      .eq('visit_uuid', visitUuid)
      .order('recommended_date', { ascending: true });

    if (error) throw new Error(`Failed to list follow-ups: ${error.message}`);
    return (data || []).map((fu) => this.formatResponse(fu));
  }

  async update(followUpUuid: string, doctorUuid: string, req: FollowUpRequest): Promise<FollowUpResponse> {
    const existing = await this.get(followUpUuid);
    if (!existing) throw new Error('Follow-up not found');

    if (existing.follow_up_status === 'CANCELLED') {
      throw new Error('Cannot update cancelled follow-up');
    }

    if (existing.doctor_uuid !== doctorUuid) {
      throw new Error('Unauthorized: only the creator can edit this follow-up');
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_follow_up')
      .update({
        recommended_date: req.recommended_date || existing.recommended_date,
        recommended_time: req.recommended_time !== undefined ? req.recommended_time : existing.recommended_time,
        follow_up_type: req.follow_up_type || existing.follow_up_type,
        instructions: req.instructions !== undefined ? req.instructions : existing.instructions,
        notes: req.notes !== undefined ? req.notes : existing.notes,
        follow_up_status: req.follow_up_status || existing.follow_up_status,
        completed_at: req.follow_up_status === 'COMPLETED' ? new Date().toISOString() : null,
        updated_by: doctorUuid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', followUpUuid)
      .select()
      .single();

    if (error) throw new Error(`Failed to update follow-up: ${error.message}`);
    return this.formatResponse(data);
  }

  private formatResponse(data: any): FollowUpResponse {
    return {
      id: data.id,
      visit_uuid: data.visit_uuid,
      follow_up_status: data.follow_up_status,
      recommended_date: data.recommended_date,
      recommended_time: data.recommended_time,
      follow_up_type: data.follow_up_type,
      instructions: data.instructions,
      notes: data.notes,
      completed_at: data.completed_at,
      completion_notes: data.completion_notes,
      doctor_uuid: data.doctor_uuid,
      created_at: data.created_at,
    };
  }
}

export class TimelineService {
  async getTimeline(visitUuid: string): Promise<TimelineEvent[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('emr_visit_timeline')
      .select('*')
      .eq('visit_uuid', visitUuid)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch timeline: ${error.message}`);
    return data || [];
  }
}
