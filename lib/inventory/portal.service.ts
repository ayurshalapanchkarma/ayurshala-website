import { supabaseAdmin } from '@/lib/supabase-admin'

export class PatientPortalService {
  /**
   * Get patient dashboard
   */
  static async getPatientDashboard(patientId: string): Promise<any> {
    // Upcoming appointment
    const { data: nextAppt } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(1)

    // Active prescriptions
    const { data: prescriptions } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'ACTIVE')

    // Pending invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('patient_id', patientId)
      .in('status', ['UNPAID', 'PARTIALLY_PAID'])

    // Active packages
    const { data: packages } = await supabaseAdmin
      .from('package_purchases')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)

    // Pending follow-ups
    const { data: followups } = await supabaseAdmin
      .from('patient_followups')
      .select('*')
      .eq('patient_id', patientId)
      .in('status', ['SCHEDULED', 'PENDING'])

    return {
      nextAppointment: nextAppt?.[0],
      activePrescriptions: prescriptions?.length || 0,
      outstandingBalance: invoices?.reduce((sum: number, i: any) => sum + i.outstanding_amount, 0) || 0,
      activePackages: packages?.length || 0,
      pendingFollowups: followups?.length || 0,
    }
  }

  /**
   * Get patient appointments
   */
  static async getPatientAppointments(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })

    return data || []
  }

  /**
   * Get patient prescriptions
   */
  static async getPatientPrescriptions(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Get patient invoices
   */
  static async getPatientInvoices(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('patient_id', patientId)
      .order('issued_at', { ascending: false })

    return data || []
  }

  /**
   * Download file
   */
  static async getFile(fileId: string, userId: string): Promise<any> {
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (!file) throw new Error('File not found')

    // Check access
    if (file.uploaded_by !== userId && !file.is_public) {
      throw new Error('Unauthorized access')
    }

    // Log download
    await supabaseAdmin.from('api_logs').insert({
      user_id: userId,
      endpoint: `/files/${fileId}`,
      method: 'GET',
      status_code: 200,
      ip_address: null,
    })

    return file
  }

  /**
   * Get patient timeline
   */
  static async getPatientTimeline(patientId: string): Promise<any[]> {
    const timeline: any[] = []

    // Appointments
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)

    timeline.push(
      ...(appointments || []).map((a: any) => ({
        type: 'APPOINTMENT',
        date: a.appointment_date,
        title: `Appointment with Dr. ${a.doctor_id}`,
        icon: 'calendar',
      })),
    )

    // Treatments
    const { data: treatments } = await supabaseAdmin
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', patientId)

    timeline.push(
      ...(treatments || []).map((t: any) => ({
        type: 'TREATMENT',
        date: t.created_at,
        title: `${t.treatment_name} - ${t.sessions_completed}/${t.sessions_planned} sessions`,
        icon: 'spa',
      })),
    )

    // Invoices
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('patient_id', patientId)

    timeline.push(
      ...(invoices || []).map((i: any) => ({
        type: 'INVOICE',
        date: i.issued_at,
        title: `Invoice ${i.invoice_number} - ₹${i.total_amount}`,
        icon: 'receipt',
      })),
    )

    return timeline.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
