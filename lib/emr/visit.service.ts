import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface VisitVitals {
  systolic_bp?: number;
  diastolic_bp?: number;
  pulse_rate?: number;
  temperature_c?: number;
  respiratory_rate?: number;
  spo2?: number;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
}

export interface VisitInput {
  patient_uuid: string;
  doctor_uuid: string;
  appointment_uuid?: string;
  visit_date: string; // YYYY-MM-DD
  visit_type?: string; // OPD, Follow-up, Emergency
  chief_complaint?: string;
  created_by: string; // User UUID
}

export interface VisitResponse {
  uuid: string;
  visit_number: string;
  patient_uuid: string;
  doctor_uuid: string;
  visit_date: string;
  visit_status: string;
  checked_in_at: string;
  patient_name?: string;
  doctor_name?: string;
  phone?: string;
  vitals?: VisitVitals;
}

export interface DoctorQueueItem {
  visit_id: string;
  visit_number: string;
  patient_name: string;
  patient_id: string;
  phone: string;
  visit_status: string;
  status_label: string;
  waiting_minutes: number;
  token_number: number;
  checked_in_at: string;
}

export class VisitService {
  /**
   * Create a new visit from a booking
   * Auto-generates visit number, sets status to CHECKED_IN
   */
  static async createVisit(input: VisitInput): Promise<VisitResponse> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('emr_visit')
        .insert({
          patient_uuid: input.patient_uuid,
          doctor_uuid: input.doctor_uuid,
          appointment_uuid: input.appointment_uuid,
          visit_date: new Date(input.visit_date),
          visit_type: input.visit_type || 'OPD',
          chief_complaint: input.chief_complaint,
          visit_status: 'CHECKED_IN',
          created_by: input.created_by,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      return this.formatVisitResponse(data);
    } catch (err) {
      console.error('Error creating visit:', err);
      throw err;
    }
  }

  /**
   * Get a specific visit with patient and doctor details
   */
  static async getVisit(visitUuid: string): Promise<VisitResponse | null> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('emr_visit')
        .select(
          `
          uuid, visit_number, visit_date, visit_status, checked_in_at,
          patient_uuid, doctor_uuid, appointment_uuid,
          chief_complaint, visit_type, duration_minutes,
          systolic_bp, diastolic_bp, pulse_rate, temperature_c, respiratory_rate, spo2,
          height_cm, weight_kg, bmi, vitals_recorded_at,
          patient:patients(id, name, phone),
          doctor:profiles(id, name),
          created_at, updated_at
          `
        )
        .eq('uuid', visitUuid)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.formatVisitResponse(data);
    } catch (err) {
      console.error('Error getting visit:', err);
      throw err;
    }
  }

  /**
   * Get today's queue for reception/admin
   */
  static async getTodaysQueue(): Promise<VisitResponse[]> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('v_todays_queue')
        .select('*')
        .order('checked_in_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        uuid: row.visit_id,
        visit_number: row.visit_number,
        patient_uuid: row.patient_id,
        doctor_uuid: row.doctor_id,
        visit_date: row.preferred_date,
        visit_status: row.visit_status,
        checked_in_at: row.checked_in_at,
        patient_name: row.patient_name,
        doctor_name: row.doctor_name,
        phone: row.phone
      }));
    } catch (err) {
      console.error('Error fetching today\'s queue:', err);
      throw err;
    }
  }

  /**
   * Get doctor's queue for today
   */
  static async getDoctorQueue(doctorUuid: string): Promise<DoctorQueueItem[]> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('v_doctor_queue')
        .select('*')
        .eq('doctor_id', doctorUuid)
        .order('checked_in_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(row => ({
        visit_id: row.visit_id,
        visit_number: row.visit_number,
        patient_name: row.patient_name,
        patient_id: row.patient_id,
        phone: row.phone,
        visit_status: row.visit_status,
        status_label: row.status_label,
        waiting_minutes: row.waiting_minutes,
        token_number: row.token_number,
        checked_in_at: row.checked_in_at
      }));
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
      throw err;
    }
  }

  /**
   * Update visit status
   */
  static async updateVisitStatus(
    visitUuid: string,
    newStatus: 'CHECKED_IN' | 'IN_CONSULTATION' | 'PRESCRIPTION_READY' | 'THERAPY_ASSIGNED' | 'COMPLETED' | 'CANCELLED',
    updatedBy: string
  ): Promise<VisitResponse> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('emr_visit')
        .update({
          visit_status: newStatus,
          updated_by: updatedBy,
          updated_at: new Date()
        })
        .eq('uuid', visitUuid)
        .select()
        .single();

      if (error) throw error;

      return this.formatVisitResponse(data);
    } catch (err) {
      console.error('Error updating visit status:', err);
      throw err;
    }
  }

  /**
   * Record vitals for a visit
   * Auto-calculates BMI if height and weight provided
   */
  static async recordVitals(
    visitUuid: string,
    vitals: VisitVitals,
    recordedBy: string
  ): Promise<VisitResponse> {
    const supabase = getSupabase();

    try {
      // Calculate BMI if needed
      let bmi = vitals.bmi;
      if (!bmi && vitals.height_cm && vitals.weight_kg) {
        const heightM = vitals.height_cm / 100;
        bmi = Math.round((vitals.weight_kg / (heightM * heightM)) * 100) / 100;
      }

      const { data, error } = await supabase
        .from('emr_visit')
        .update({
          systolic_bp: vitals.systolic_bp,
          diastolic_bp: vitals.diastolic_bp,
          pulse_rate: vitals.pulse_rate,
          temperature_c: vitals.temperature_c,
          respiratory_rate: vitals.respiratory_rate,
          spo2: vitals.spo2,
          height_cm: vitals.height_cm,
          weight_kg: vitals.weight_kg,
          bmi,
          vitals_recorded_at: new Date(),
          vitals_recorded_by: recordedBy,
          updated_by: recordedBy,
          updated_at: new Date()
        })
        .eq('uuid', visitUuid)
        .select()
        .single();

      if (error) throw error;

      return this.formatVisitResponse(data);
    } catch (err) {
      console.error('Error recording vitals:', err);
      throw err;
    }
  }

  /**
   * Get visit timeline
   */
  static async getTimeline(visitUuid: string): Promise<any[]> {
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('emr_visit_timeline')
        .select(
          `
          uuid, event_type, title, description, actor_uuid, metadata,
          created_at, actor:profiles(name)
          `
        )
        .eq('visit_uuid', visitUuid)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error fetching timeline:', err);
      throw err;
    }
  }

  /**
   * Log a custom timeline event
   * Called by service layer for business events
   */
  static async logTimelineEvent(
    visitUuid: string,
    eventType: string,
    title: string,
    description?: string,
    actorUuid?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = getSupabase();

    try {
      const { error } = await supabase
        .from('emr_visit_timeline')
        .insert({
          visit_uuid: visitUuid,
          event_type: eventType as any,
          title,
          description,
          actor_uuid: actorUuid,
          metadata: metadata || {},
          created_at: new Date()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging timeline event:', err);
      throw err;
    }
  }

  /**
   * Private helper: Format visit response with nested data
   */
  private static formatVisitResponse(rawData: any): VisitResponse {
    return {
      uuid: rawData.uuid,
      visit_number: rawData.visit_number,
      patient_uuid: rawData.patient_uuid,
      doctor_uuid: rawData.doctor_uuid,
      visit_date: rawData.visit_date,
      visit_status: rawData.visit_status,
      checked_in_at: rawData.checked_in_at,
      patient_name: rawData.patient?.name,
      doctor_name: rawData.doctor?.name,
      phone: rawData.patient?.phone,
      vitals: {
        systolic_bp: rawData.systolic_bp,
        diastolic_bp: rawData.diastolic_bp,
        pulse_rate: rawData.pulse_rate,
        temperature_c: rawData.temperature_c,
        respiratory_rate: rawData.respiratory_rate,
        spo2: rawData.spo2,
        height_cm: rawData.height_cm,
        weight_kg: rawData.weight_kg,
        bmi: rawData.bmi
      }
    };
  }

  /**
   * Find or create visit for a booking
   * Used by reception during check-in
   */
  static async findOrCreateVisitFromBooking(
    bookingId: number,
    doctorUuid: string,
    createdBy: string
  ): Promise<VisitResponse> {
    const supabase = getSupabase();

    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings_new')
        .select('id, patient_uuid, preferred_date')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) throw new Error('Booking not found');

      // Check if visit already exists for this booking
      const { data: existingVisit } = await supabase
        .from('emr_visit')
        .select('*')
        .eq('appointment_uuid', bookingId.toString())
        .eq('patient_uuid', booking.patient_uuid)
        .eq('visit_date', booking.preferred_date)
        .single();

      if (existingVisit) {
        return this.formatVisitResponse(existingVisit);
      }

      // Create new visit
      return this.createVisit({
        patient_uuid: booking.patient_uuid,
        doctor_uuid: doctorUuid,
        appointment_uuid: bookingId.toString(),
        visit_date: booking.preferred_date,
        created_by: createdBy
      });
    } catch (err) {
      console.error('Error finding/creating visit from booking:', err);
      throw err;
    }
  }
}
