import { supabaseAdmin } from '@/lib/supabase-admin'
import { InventoryEngineService } from './inventory-engine.service'
import { FIFOService } from './fifo.service'
import { ValidationException } from './types'

export interface CreateTreatmentPlanInput {
  prescriptionId: string
  prescriptionTreatmentId?: string
  patientId: string
  doctorId: string
  treatmentName: string
  sessionNumber: number
  frequency: string
  durationDays: number
  startDate: string
  specialInstructions?: string
}

export interface ScheduleSessionInput {
  treatmentPlanId: string
  sessionNumber: number
  sessionDate: string
  startTime: string
  endTime: string
  roomId: string
  primaryTherapistId: string
  assistantTherapistId?: string
}

export interface CompleteSessionInput {
  sessionId: string
  therapistNotes?: string
  painScoreBefore?: number
  painScoreAfter?: number
  mobilityScore?: number
  weightKg?: number
  bpSystolic?: number
  bpDiastolic?: number
  pulseRate?: number
  remarks?: string
  sideEffects?: string
}

export class TreatmentService {
  /**
   * Create treatment plan from prescription
   */
  static async createTreatmentPlan(input: CreateTreatmentPlanInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.prescriptionId?.trim()) errors.push({ field: 'prescriptionId', message: 'Prescription required' })
    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.treatmentName?.trim()) errors.push({ field: 'treatmentName', message: 'Treatment name required' })
    if (!input.sessionNumber || input.sessionNumber <= 0) errors.push({ field: 'sessionNumber', message: 'Valid session number required' })
    if (!input.startDate) errors.push({ field: 'startDate', message: 'Start date required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const tpNumber = await this.generateTreatmentPlanNumber()
    const endDate = new Date(input.startDate)
    endDate.setDate(endDate.getDate() + input.durationDays)

    const { data: plan, error } = await supabaseAdmin
      .from('treatment_plans')
      .insert({
        treatment_plan_number: tpNumber,
        prescription_id: input.prescriptionId,
        prescription_treatment_id: input.prescriptionTreatmentId || null,
        patient_id: input.patientId,
        doctor_id: input.doctorId,
        treatment_name: input.treatmentName,
        sessions_planned: input.sessionNumber,
        frequency: input.frequency,
        duration_days: input.durationDays,
        start_date: input.startDate,
        end_date: endDate.toISOString().split('T')[0],
        status: 'PLANNED',
        special_instructions: input.specialInstructions || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create treatment plan: ${error.message}`)
    return plan
  }

  /**
   * Schedule treatment session
   */
  static async scheduleSession(input: ScheduleSessionInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.treatmentPlanId?.trim()) errors.push({ field: 'treatmentPlanId', message: 'Treatment plan required' })
    if (!input.sessionDate) errors.push({ field: 'sessionDate', message: 'Session date required' })
    if (!input.roomId?.trim()) errors.push({ field: 'roomId', message: 'Room required' })
    if (!input.primaryTherapistId?.trim()) errors.push({ field: 'primaryTherapistId', message: 'Primary therapist required' })

    if (errors.length > 0) throw new ValidationException(errors)

    // Check therapist availability
    const existingSession = await supabaseAdmin
      .from('treatment_sessions')
      .select('*')
      .eq('primary_therapist_id', input.primaryTherapistId)
      .eq('session_date', input.sessionDate)
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED')

    if (existingSession.data && existingSession.data.length > 0) {
      const existingTime = existingSession.data[0]
      const conflict = this.timesOverlap(input.startTime, input.endTime, existingTime.start_time, existingTime.end_time)
      if (conflict) throw new Error('Therapist not available at this time')
    }

    // Check room availability
    const roomConflict = await supabaseAdmin
      .from('treatment_sessions')
      .select('*')
      .eq('room_id', input.roomId)
      .eq('session_date', input.sessionDate)
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED')

    if (roomConflict.data && roomConflict.data.length > 0) {
      const existing = roomConflict.data[0]
      const conflict = this.timesOverlap(input.startTime, input.endTime, existing.start_time, existing.end_time)
      if (conflict) throw new Error('Room not available at this time')
    }

    const duration = this.calculateDuration(input.startTime, input.endTime)

    const { data: session, error } = await supabaseAdmin
      .from('treatment_sessions')
      .insert({
        treatment_plan_id: input.treatmentPlanId,
        session_number: input.sessionNumber,
        session_date: input.sessionDate,
        start_time: input.startTime,
        end_time: input.endTime,
        duration_minutes: duration,
        status: 'SCHEDULED',
        room_id: input.roomId,
        primary_therapist_id: input.primaryTherapistId,
        assistant_therapist_id: input.assistantTherapistId || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to schedule session: ${error.message}`)
    return session
  }

  /**
   * Complete session + consume inventory
   */
  static async completeSession(input: CompleteSessionInput, userId: string): Promise<any> {
    // Get session with treatment plan details
    const { data: session } = await supabaseAdmin
      .from('treatment_sessions')
      .select('*, treatment_plans(product_id)')
      .eq('id', input.sessionId)
      .single()

    if (!session) throw new Error('Session not found')
    if (session.status === 'CANCELLED') throw new Error('Cannot complete cancelled session')

    // Mark session completed
    const { data: completed } = await supabaseAdmin
      .from('treatment_sessions')
      .update({ status: 'COMPLETED' })
      .eq('id', input.sessionId)
      .select()
      .single()

    // Record progress
    if (input.painScoreBefore !== undefined || input.mobilityScore !== undefined) {
      await supabaseAdmin.from('treatment_progress').insert({
        session_id: input.sessionId,
        patient_id: session.treatment_plans.patient_id,
        pain_score_before: input.painScoreBefore || null,
        pain_score_after: input.painScoreAfter || null,
        mobility_score: input.mobilityScore || null,
        weight_kg: input.weightKg || null,
        bp_systolic: input.bpSystolic || null,
        bp_diastolic: input.bpDiastolic || null,
        pulse_rate: input.pulseRate || null,
        remarks: input.remarks || null,
        side_effects: input.sideEffects || null,
      })
    }

    // Get items consumed in session
    const { data: items } = await supabaseAdmin
      .from('treatment_session_items')
      .select('*')
      .eq('session_id', input.sessionId)

    // Consume inventory via InventoryEngineService for each item
    for (const item of items || []) {
      const batches = await FIFOService.getFIFOBatches(item.product_id, item.quantity_used)

      for (const batch of batches) {
        await InventoryEngineService.recordMovement(
          {
            productId: item.product_id,
            batchId: batch.batchId,
            movementType: 'TREATMENT_CONSUMPTION',
            quantityOut: batch.quantityToConsume,
            referenceId: input.sessionId,
            referenceType: 'TREATMENT_SESSION',
            referenceNumber: `SESSION-${session.session_number}`,
            remarks: input.therapistNotes || 'Treatment session consumption',
          },
          userId,
        )
      }
    }

    // Update treatment plan session count
    const { data: plan } = await supabaseAdmin
      .from('treatment_plans')
      .select('sessions_completed, sessions_planned')
      .eq('id', session.treatment_plan_id)
      .single()

    const newCount = (plan?.sessions_completed || 0) + 1
    const newStatus = newCount === plan?.sessions_planned ? 'COMPLETED' : 'IN_PROGRESS'

    await supabaseAdmin
      .from('treatment_plans')
      .update({
        sessions_completed: newCount,
        status: newStatus,
      })
      .eq('id', session.treatment_plan_id)

    return completed
  }

  /**
   * Get treatment plan with sessions
   */
  static async getTreatmentPlan(planId: string): Promise<any> {
    const { data: plan } = await supabaseAdmin
      .from('treatment_plans')
      .select('*')
      .eq('id', planId)
      .single()

    const { data: sessions } = await supabaseAdmin
      .from('treatment_sessions')
      .select(`
        *,
        treatment_session_items(*),
        treatment_progress(*)
      `)
      .eq('treatment_plan_id', planId)
      .order('session_number', { ascending: true })

    return { ...plan, sessions: sessions || [] }
  }

  /**
   * Get patient's treatment plans
   */
  static async getPatientTreatments(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Get today's sessions
   */
  static async getTodaySessions(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabaseAdmin
      .from('treatment_sessions')
      .select(`
        *,
        treatment_plans(treatment_name, patient_id, patients(name)),
        treatment_rooms(room_number, room_type),
        therapists!primary(name)
      `)
      .eq('session_date', today)
      .eq('is_deleted', false)
      .order('start_time', { ascending: true })

    return data || []
  }

  /**
   * Get therapist schedule
   */
  static async getTherapistSchedule(therapistId: string, date: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_sessions')
      .select(`
        *,
        treatment_plans(treatment_name, patient_id, patients(name)),
        treatment_rooms(room_number)
      `)
      .eq('primary_therapist_id', therapistId)
      .eq('session_date', date)
      .eq('is_deleted', false)
      .order('start_time', { ascending: true })

    return data || []
  }

  /**
   * Get room availability
   */
  static async getRoomAvailability(roomId: string, date: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_sessions')
      .select('start_time, end_time, status')
      .eq('room_id', roomId)
      .eq('session_date', date)
      .eq('is_deleted', false)
      .neq('status', 'CANCELLED')

    return data || []
  }

  private static timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    if (!start2 || !end2) return false
    const s1 = new Date(`2000-01-01T${start1}`)
    const e1 = new Date(`2000-01-01T${end1}`)
    const s2 = new Date(`2000-01-01T${start2}`)
    const e2 = new Date(`2000-01-01T${end2}`)
    return s1 < e2 && s2 < e1
  }

  private static calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    return Math.floor((end.getTime() - start.getTime()) / 60000)
  }

  private static async generateTreatmentPlanNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('treatment_plans')
      .select('treatment_plan_number')
      .like('treatment_plan_number', `TP-${year}-%`)
      .order('treatment_plan_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].treatment_plan_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `TP-${year}-${seq}`
  }
}
