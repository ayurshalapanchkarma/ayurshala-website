import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type FollowupStatus = 'SCHEDULED' | 'PENDING' | 'COMPLETED' | 'MISSED' | 'CANCELLED'
export type FollowupPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CommunicationChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'PHONE_CALL' | 'INTERNAL_NOTE'
export type ReminderType = 'APPOINTMENT' | 'TREATMENT_SESSION' | 'MEDICINE_REFILL' | 'FOLLOWUP' | 'PACKAGE_EXPIRY' | 'BIRTHDAY' | 'ANNIVERSARY'
export type PatientSegment = 'NEW_PATIENT' | 'RETURNING_PATIENT' | 'VIP' | 'PACKAGE_HOLDER' | 'CHRONIC_PATIENT' | 'DIABETES' | 'ARTHRITIS' | 'PANCHAKARMA' | 'PENDING_FOLLOWUP' | 'INACTIVE' | 'CUSTOM'

export interface CreateFollowupInput {
  patientId: string
  doctorId?: string
  appointmentId?: string
  prescriptionId?: string
  treatmentPlanId?: string
  followupType: string
  dueDate: string
  priority?: FollowupPriority
  reason?: string
}

export interface CreateReminderInput {
  patientId: string
  reminderType: ReminderType
  relatedId?: string
  relatedType?: string
  reminderDate: string
  reminderTime?: string
  message?: string
}

export interface LogCommunicationInput {
  patientId: string
  channel: CommunicationChannel
  templateId?: string
  recipientPhone?: string
  recipientEmail?: string
  subject?: string
  messageBody: string
  sentBy: string
}

export interface AddPatientNoteInput {
  patientId: string
  noteType?: string
  noteText: string
  createdBy: string
}

export interface SubmitFeedbackInput {
  patientId: string
  appointmentId?: string
  treatmentPlanId?: string
  feedbackType?: string
  rating: number
  comments?: string
  suggestions?: string
}

export class CRMService {
  /**
   * Create follow-up
   */
  static async createFollowup(input: CreateFollowupInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.followupType?.trim()) errors.push({ field: 'followupType', message: 'Followup type required' })
    if (!input.dueDate) errors.push({ field: 'dueDate', message: 'Due date required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('patient_followups')
      .insert({
        patient_id: input.patientId,
        doctor_id: input.doctorId || null,
        appointment_id: input.appointmentId || null,
        prescription_id: input.prescriptionId || null,
        treatment_plan_id: input.treatmentPlanId || null,
        followup_type: input.followupType,
        due_date: input.dueDate,
        priority: input.priority || 'MEDIUM',
        reason: input.reason || null,
        status: 'SCHEDULED',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create followup: ${error.message}`)
    return data
  }

  /**
   * Get pending follow-ups
   */
  static async getPendingFollowups(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('patient_followups')
      .select('*')
      .in('status', ['SCHEDULED', 'PENDING'])
      .lte('due_date', new Date().toISOString().split('T')[0])
      .eq('is_deleted', false)
      .order('due_date', { ascending: true })

    return data || []
  }

  /**
   * Get patient's follow-ups
   */
  static async getPatientFollowups(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('patient_followups')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('due_date', { ascending: true })

    return data || []
  }

  /**
   * Complete follow-up
   */
  static async completeFollowup(followupId: string, userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('patient_followups')
      .update({
        status: 'COMPLETED',
        completed_at: new Date(),
        completed_by: userId,
      })
      .eq('id', followupId)
      .select()
      .single()

    if (error) throw new Error(`Failed to complete followup: ${error.message}`)
    return data
  }

  /**
   * Create reminder
   */
  static async createReminder(input: CreateReminderInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.reminderType) errors.push({ field: 'reminderType', message: 'Reminder type required' })
    if (!input.reminderDate) errors.push({ field: 'reminderDate', message: 'Reminder date required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('reminders')
      .insert({
        patient_id: input.patientId,
        reminder_type: input.reminderType,
        related_id: input.relatedId || null,
        related_type: input.relatedType || null,
        reminder_date: input.reminderDate,
        reminder_time: input.reminderTime || null,
        message: input.message || null,
        status: 'PENDING',
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create reminder: ${error.message}`)
    return data
  }

  /**
   * Get pending reminders
   */
  static async getPendingReminders(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('status', 'PENDING')
      .lte('reminder_date', today)
      .eq('is_deleted', false)
      .order('reminder_date', { ascending: true })

    return data || []
  }

  /**
   * Log communication
   */
  static async logCommunication(input: LogCommunicationInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.channel) errors.push({ field: 'channel', message: 'Channel required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const { data, error } = await supabaseAdmin
      .from('communication_logs')
      .insert({
        patient_id: input.patientId,
        channel: input.channel,
        template_id: input.templateId || null,
        recipient_phone: input.recipientPhone || null,
        recipient_email: input.recipientEmail || null,
        subject: input.subject || null,
        message_body: input.messageBody,
        status: 'SENT',
        sent_by: input.sentBy,
        sent_at: new Date(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to log communication: ${error.message}`)
    return data
  }

  /**
   * Get patient communication history
   */
  static async getPatientCommunications(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('communication_logs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Add patient note
   */
  static async addPatientNote(input: AddPatientNoteInput): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('patient_notes')
      .insert({
        patient_id: input.patientId,
        note_type: input.noteType || null,
        note_text: input.noteText,
        created_by: input.createdBy,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to add note: ${error.message}`)
    return data
  }

  /**
   * Get patient notes
   */
  static async getPatientNotes(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('patient_notes')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Tag patient
   */
  static async tagPatient(patientId: string, tagName: string, segment?: PatientSegment): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('patient_tags')
      .insert({
        patient_id: patientId,
        tag_name: tagName,
        segment: segment || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to tag patient: ${error.message}`)
    return data
  }

  /**
   * Get patient tags
   */
  static async getPatientTags(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('patient_tags')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Submit feedback
   */
  static async submitFeedback(input: SubmitFeedbackInput): Promise<any> {
    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new ValidationException([{ field: 'rating', message: 'Rating must be 1-5' }])
    }

    const { data, error } = await supabaseAdmin
      .from('patient_feedback')
      .insert({
        patient_id: input.patientId,
        appointment_id: input.appointmentId || null,
        treatment_plan_id: input.treatmentPlanId || null,
        feedback_type: input.feedbackType || null,
        rating: input.rating,
        comments: input.comments || null,
        suggestions: input.suggestions || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to submit feedback: ${error.message}`)
    return data
  }

  /**
   * Get patient timeline
   */
  static async getPatientTimeline(patientId: string): Promise<any> {
    const timeline: any[] = []

    // Appointments
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_date, reason, status')
      .eq('patient_id', patientId)

    timeline.push(
      ...(appointments || []).map((a: any) => ({
        type: 'APPOINTMENT',
        date: a.appointment_date,
        data: a,
      })),
    )

    // Treatments
    const { data: treatments } = await supabaseAdmin
      .from('treatment_plans')
      .select('id, created_at, treatment_name, status')
      .eq('patient_id', patientId)

    timeline.push(
      ...(treatments || []).map((t: any) => ({
        type: 'TREATMENT',
        date: t.created_at,
        data: t,
      })),
    )

    // Prescriptions
    const { data: prescriptions } = await supabaseAdmin
      .from('prescriptions')
      .select('id, created_at, diagnosis, status')
      .eq('patient_id', patientId)

    timeline.push(
      ...(prescriptions || []).map((p: any) => ({
        type: 'PRESCRIPTION',
        date: p.created_at,
        data: p,
      })),
    )

    // Invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, issued_at, invoice_number, total_amount, status')
      .eq('patient_id', patientId)

    timeline.push(
      ...(invoices || []).map((i: any) => ({
        type: 'INVOICE',
        date: i.issued_at,
        data: i,
      })),
    )

    // Communications
    const { data: comms } = await supabaseAdmin
      .from('communication_logs')
      .select('id, created_at, channel, status')
      .eq('patient_id', patientId)

    timeline.push(
      ...(comms || []).map((c: any) => ({
        type: 'COMMUNICATION',
        date: c.created_at,
        data: c,
      })),
    )

    // Feedback
    const { data: feedback } = await supabaseAdmin
      .from('patient_feedback')
      .select('id, created_at, rating, comments')
      .eq('patient_id', patientId)

    timeline.push(
      ...(feedback || []).map((f: any) => ({
        type: 'FEEDBACK',
        date: f.created_at,
        data: f,
      })),
    )

    return timeline.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Get CRM dashboard metrics
   */
  static async getCRMDashboard(): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    // Today's follow-ups
    const { data: todayFollowups } = await supabaseAdmin
      .from('patient_followups')
      .select('id')
      .eq('due_date', today)
      .in('status', ['SCHEDULED', 'PENDING'])

    // Missed follow-ups
    const { data: missedFollowups } = await supabaseAdmin
      .from('patient_followups')
      .select('id')
      .lt('due_date', today)
      .eq('status', 'PENDING')

    // Inactive patients (90+ days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: inactivePatients } = await supabaseAdmin
      .from('patients')
      .select('id')
      .lt('updated_at', ninetyDaysAgo.toISOString())

    // Average feedback rating
    const { data: feedback } = await supabaseAdmin
      .from('patient_feedback')
      .select('rating')

    const avgRating = feedback?.length ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length : 0

    return {
      todayFollowups: todayFollowups?.length || 0,
      missedFollowups: missedFollowups?.length || 0,
      inactivePatients: inactivePatients?.length || 0,
      avgFeedbackRating: Math.round(avgRating * 10) / 10,
    }
  }
}
