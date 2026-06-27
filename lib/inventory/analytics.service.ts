import { supabaseAdmin } from '@/lib/supabase-admin'

export class AnalyticsService {
  /**
   * Executive Dashboard - Today's metrics
   */
  static async getExecutiveDashboard(): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    // Today's revenue
    const { data: todayRevenue } = await supabaseAdmin
      .from('mv_daily_revenue')
      .select('total_revenue, invoice_count, patient_count')
      .eq('payment_date', today)
      .single()

    // Monthly revenue (year-to-date)
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    const { data: monthlyRevenue } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('payment_date', `${monthStartStr}T00:00:00`)
      .eq('payment_status', 'SUCCESS')

    const totalMonthly = monthlyRevenue?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    // Consultations today
    const { data: consultations } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('appointment_date', today)

    // New patients this month
    const { data: newPatients } = await supabaseAdmin
      .from('patients')
      .select('id')
      .gte('created_at', `${monthStartStr}T00:00:00`)

    // Outstanding invoices
    const { data: outstanding } = await supabaseAdmin
      .from('invoices')
      .select('outstanding_amount')
      .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])

    const totalOutstanding = outstanding?.reduce((sum: number, i: any) => sum + (i.outstanding_amount || 0), 0) || 0

    return {
      todayRevenue: todayRevenue?.total_revenue || 0,
      monthlyRevenue: totalMonthly,
      consultationsToday: consultations?.length || 0,
      newPatientsMonth: newPatients?.length || 0,
      outstandingPayments: totalOutstanding,
    }
  }

  /**
   * Doctor Dashboard
   */
  static async getDoctorDashboard(doctorId: string): Promise<any> {
    const { data: performance } = await supabaseAdmin
      .from('mv_doctor_performance')
      .select('consultation_count, prescription_count, avg_rating')
      .eq('doctor_id', doctorId)
      .single()

    // Revenue generated
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('consultation_id', doctorId)

    const revenue = invoices?.reduce((sum: number, i: any) => sum + i.paid_amount, 0) || 0

    // Pending follow-ups
    const { data: pendingFollowups } = await supabaseAdmin
      .from('patient_followups')
      .select('id')
      .eq('doctor_id', doctorId)
      .in('status', ['SCHEDULED', 'PENDING'])

    return {
      consultations: performance?.consultation_count || 0,
      prescriptions: performance?.prescription_count || 0,
      revenueGenerated: revenue,
      avgRating: performance?.avg_rating || 0,
      pendingFollowups: pendingFollowups?.length || 0,
    }
  }

  /**
   * Treatment Analytics
   */
  static async getTreatmentAnalytics(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('mv_treatment_analytics')
      .select('*')
      .order('total_plans', { ascending: false })

    return data || []
  }

  /**
   * Inventory Analytics
   */
  static async getInventoryAnalytics(): Promise<any> {
    const { data: inventory } = await supabaseAdmin
      .from('mv_inventory_analytics')
      .select('*')

    const totalValue = inventory?.reduce((sum: number, p: any) => sum + (p.current_stock * 100 || 0), 0) || 0

    const fastMoving = inventory?.filter((p: any) => p.total_consumed > 100) || []
    const slowMoving = inventory?.filter((p: any) => p.total_consumed > 0 && p.total_consumed <= 10) || []
    const deadStock = inventory?.filter((p: any) => p.total_consumed === 0 && p.current_stock > 0) || []

    return {
      inventoryValue: totalValue,
      fastMovingItems: fastMoving.length,
      slowMovingItems: slowMoving.length,
      deadStockItems: deadStock.length,
      products: inventory || [],
    }
  }

  /**
   * Finance Analytics
   */
  static async getFinanceAnalytics(fromDate: string, toDate: string): Promise<any> {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount, payment_method')
      .gte('payment_date', `${fromDate}T00:00:00`)
      .lte('payment_date', `${toDate}T23:59:59`)
      .eq('payment_status', 'SUCCESS')

    const totalRevenue = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0

    const byMethod: Record<string, number> = {}
    for (const p of payments || []) {
      if (!byMethod[p.payment_method]) byMethod[p.payment_method] = 0
      byMethod[p.payment_method] += p.amount
    }

    const { data: refunds } = await supabaseAdmin
      .from('refunds')
      .select('refund_amount')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)

    const totalRefunded = refunds?.reduce((sum: number, r: any) => sum + r.refund_amount, 0) || 0

    const { data: outstanding } = await supabaseAdmin
      .from('invoices')
      .select('outstanding_amount')
      .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])

    const totalOutstanding = outstanding?.reduce((sum: number, i: any) => sum + i.outstanding_amount, 0) || 0

    return {
      totalRevenue,
      collections: totalRevenue,
      outstanding: totalOutstanding,
      refunds: totalRefunded,
      paymentMethods: byMethod,
      netRevenue: totalRevenue - totalRefunded,
    }
  }

  /**
   * Patient Analytics
   */
  static async getPatientAnalytics(): Promise<any> {
    const { data: patients } = await supabaseAdmin
      .from('mv_patient_analytics')
      .select('*')

    const ageDistribution: Record<string, number> = {}
    const genderDistribution: Record<string, number> = {}
    const cityDistribution: Record<string, number> = {}

    for (const p of patients || []) {
      const ageGroup = p.age ? `${Math.floor(p.age / 10) * 10}-${Math.floor(p.age / 10) * 10 + 9}` : 'Unknown'
      ageDistribution[ageGroup] = (ageDistribution[ageGroup] || 0) + 1

      if (p.gender) genderDistribution[p.gender] = (genderDistribution[p.gender] || 0) + 1
      if (p.city) cityDistribution[p.city] = (cityDistribution[p.city] || 0) + 1
    }

    const avgSatisfaction = patients?.length
      ? patients.reduce((sum: number, p: any) => sum + (p.avg_satisfaction || 0), 0) / patients.length
      : 0

    const returningPatients = patients?.filter((p: any) => p.visit_count > 1).length || 0
    const retentionRate = patients?.length ? ((returningPatients / patients.length) * 100).toFixed(2) : 0

    return {
      totalPatients: patients?.length || 0,
      returningPatients,
      retentionRate,
      avgSatisfaction: (avgSatisfaction * 10) / 10,
      ageDistribution,
      genderDistribution,
      cityDistribution,
    }
  }

  /**
   * Package Analytics
   */
  static async getPackageAnalytics(): Promise<any> {
    const { data: purchases } = await supabaseAdmin
      .from('package_purchases')
      .select('sessions_purchased, sessions_consumed, is_active')

    const totalSold = purchases?.reduce((sum: number, p: any) => sum + p.sessions_purchased, 0) || 0
    const totalConsumed = purchases?.reduce((sum: number, p: any) => sum + p.sessions_consumed, 0) || 0
    const activePackages = purchases?.filter((p: any) => p.is_active).length || 0

    return {
      packagesSold: purchases?.length || 0,
      totalSessions: totalSold,
      sessionsConsumed: totalConsumed,
      activePackages,
      utilizationRate: totalSold ? ((totalConsumed / totalSold) * 100).toFixed(2) : 0,
    }
  }

  /**
   * CRM Analytics
   */
  static async getCRMAnalytics(): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    // Follow-ups due today
    const { data: dueToday } = await supabaseAdmin
      .from('patient_followups')
      .select('id')
      .eq('due_date', today)
      .in('status', ['SCHEDULED', 'PENDING'])

    // Missed follow-ups
    const { data: missed } = await supabaseAdmin
      .from('patient_followups')
      .select('id')
      .lt('due_date', today)
      .eq('status', 'PENDING')

    // Communications last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: comms } = await supabaseAdmin
      .from('communication_logs')
      .select('channel, status')
      .gte('created_at', sevenDaysAgo.toISOString())

    const commByChannel: Record<string, number> = {}
    for (const c of comms || []) {
      if (!commByChannel[c.channel]) commByChannel[c.channel] = 0
      commByChannel[c.channel] += 1
    }

    return {
      followupsDue: dueToday?.length || 0,
      missedFollowups: missed?.length || 0,
      communicationsByChannel: commByChannel,
    }
  }

  /**
   * Revenue Trend (last 30 days)
   */
  static async getRevenueTrend(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('mv_daily_revenue')
      .select('payment_date, total_revenue, invoice_count')
      .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('payment_date', { ascending: true })

    return data || []
  }

  /**
   * Get KPI
   */
  static async getKPIs(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('kpi_targets')
      .select('kpi_name, target_value, current_value, status')

    return data || []
  }

  /**
   * Update KPI
   */
  static async updateKPI(kpiId: string, currentValue: number): Promise<any> {
    const { data: kpi } = await supabaseAdmin
      .from('kpi_targets')
      .select('target_value')
      .eq('id', kpiId)
      .single()

    const variance = kpi
      ? ((currentValue - (kpi.target_value || 0)) / (kpi.target_value || 1)) * 100
      : 0
    const status = variance >= 0 ? 'ON_TRACK' : 'BEHIND'

    await supabaseAdmin
      .from('kpi_targets')
      .update({
        current_value: currentValue,
        status,
        updated_at: new Date(),
      })
      .eq('id', kpiId)

    // Record history
    await supabaseAdmin.from('kpi_history').insert({
      kpi_id: kpiId,
      recorded_value: currentValue,
      recorded_date: new Date().toISOString().split('T')[0],
      variance_percentage: variance,
      status,
    })

    return { status, variance }
  }

  /**
   * Save Report
   */
  static async saveReport(reportName: string, reportType: string, module: string, filters: any, userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('saved_reports')
      .insert({
        report_name: reportName,
        report_type: reportType,
        module,
        filters,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save report: ${error.message}`)
    return data
  }

  /**
   * Get saved reports
   */
  static async getSavedReports(userId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('saved_reports')
      .select('*')
      .or(`created_by.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false })

    return data || []
  }
}
