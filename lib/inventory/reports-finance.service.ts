import { supabaseAdmin } from '@/lib/supabase-admin'

export class ReportsService {
  /**
   * Revenue report
   */
  static async getRevenueReport(fromDate: string, toDate: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('issued_at, total_amount, paid_amount, invoice_type')
      .gte('issued_at', `${fromDate}T00:00:00`)
      .lte('issued_at', `${toDate}T23:59:59`)
      .in('status', ['PAID', 'PARTIALLY_PAID'])

    const typeRevenue: Record<string, number> = {}
    let totalRevenue = 0

    for (const inv of invoices || []) {
      if (!typeRevenue[inv.invoice_type]) typeRevenue[inv.invoice_type] = 0
      typeRevenue[inv.invoice_type] += inv.paid_amount
      totalRevenue += inv.paid_amount
    }

    return { totalRevenue, byType: typeRevenue, invoiceCount: invoices?.length || 0 }
  }

  /**
   * Collection report
   */
  static async getCollectionReport(fromDate: string, toDate: string): Promise<any> {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('payment_method, amount, payment_date')
      .gte('payment_date', `${fromDate}T00:00:00`)
      .lte('payment_date', `${toDate}T23:59:59`)
      .eq('payment_status', 'SUCCESS')

    const byMethod: Record<string, number> = {}
    let totalCollected = 0

    for (const p of payments || []) {
      if (!byMethod[p.payment_method]) byMethod[p.payment_method] = 0
      byMethod[p.payment_method] += p.amount
      totalCollected += p.amount
    }

    return { totalCollected, byMethod, paymentCount: payments?.length || 0 }
  }

  /**
   * Outstanding report
   */
  static async getOutstandingReport(): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, patient_id, outstanding_amount, issued_at, status')
      .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])

    const overdue = invoices?.filter((inv: any) => {
      const dueDate = new Date(inv.issued_at)
      dueDate.setDate(dueDate.getDate() + 30)
      return dueDate < new Date()
    }) || []

    const totalOutstanding = invoices?.reduce((sum: number, inv: any) => sum + inv.outstanding_amount, 0) || 0
    const overduAmount = overdue.reduce((sum: number, inv: any) => sum + inv.outstanding_amount, 0)

    return {
      totalOutstanding,
      overdueAmount: overduAmount,
      invoiceCount: invoices?.length || 0,
      overdueCount: overdue.length,
      invoices: invoices || [],
    }
  }

  /**
   * GST report
   */
  static async getGSTReport(fromDate: string, toDate: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('gst_slab, gst_amount, paid_amount')
      .gte('issued_at', `${fromDate}T00:00:00`)
      .lte('issued_at', `${toDate}T23:59:59`)
      .in('status', ['PAID', 'PARTIALLY_PAID'])

    const bySlabs: Record<string, { amount: number; gst: number }> = {}
    let totalGST = 0

    for (const inv of invoices || []) {
      const slab = `${inv.gst_slab}%`
      if (!bySlabs[slab]) bySlabs[slab] = { amount: 0, gst: 0 }
      bySlabs[slab].amount += inv.paid_amount
      bySlabs[slab].gst += inv.gst_amount
      totalGST += inv.gst_amount
    }

    return { totalGST, bySlabs }
  }

  /**
   * Refund report
   */
  static async getRefundReport(fromDate: string, toDate: string): Promise<any> {
    const { data: refunds } = await supabaseAdmin
      .from('refunds')
      .select('refund_number, refund_reason, refund_amount, status, created_at')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)

    const byReason: Record<string, number> = {}
    let totalRefunded = 0

    for (const r of refunds || []) {
      if (!byReason[r.refund_reason]) byReason[r.refund_reason] = 0
      byReason[r.refund_reason] += r.refund_amount
      totalRefunded += r.refund_amount
    }

    return {
      totalRefunded,
      byReason,
      refundCount: refunds?.length || 0,
      refunds: refunds || [],
    }
  }

  /**
   * Package utilization
   */
  static async getPackageUtilization(): Promise<any> {
    const { data: purchases } = await supabaseAdmin
      .from('package_purchases')
      .select(`
        id,
        sessions_purchased,
        sessions_consumed,
        sessions_remaining,
        is_active,
        packages(package_name)
      `)

    const byPackage: Record<string, any> = {}

    for (const p of purchases || []) {
      const pkgName = (p as any).packages.package_name
      if (!byPackage[pkgName]) {
        byPackage[pkgName] = { purchased: 0, consumed: 0, remaining: 0, active: 0 }
      }
      byPackage[pkgName].purchased += (p as any).sessions_purchased
      byPackage[pkgName].consumed += (p as any).sessions_consumed
      byPackage[pkgName].remaining += (p as any).sessions_remaining
      if ((p as any).is_active) byPackage[pkgName].active += 1
    }

    return byPackage
  }

  /**
   * Doctor revenue
   */
  static async getDoctorRevenue(doctorId: string, fromDate: string, toDate: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('consultation_id, total_amount, paid_amount')
      .gte('issued_at', `${fromDate}T00:00:00`)
      .lte('issued_at', `${toDate}T23:59:59`)

    // Note: This requires consultation table to have doctor_id link
    // For now, return structure
    let totalRevenue = 0
    for (const inv of invoices || []) {
      totalRevenue += inv.paid_amount
    }

    return { doctorId, totalRevenue, invoiceCount: invoices?.length || 0 }
  }

  /**
   * Treatment revenue
   */
  static async getTreatmentRevenue(fromDate: string, toDate: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('invoice_type', 'PANCHAKARMA')
      .gte('issued_at', `${fromDate}T00:00:00`)
      .lte('issued_at', `${toDate}T23:59:59`)
      .in('status', ['PAID', 'PARTIALLY_PAID'])

    let totalRevenue = 0
    for (const inv of invoices || []) {
      totalRevenue += inv.paid_amount
    }

    return { totalRevenue, invoiceCount: invoices?.length || 0 }
  }

  /**
   * Medicine revenue
   */
  static async getMedicineRevenue(fromDate: string, toDate: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('invoice_type', 'PHARMACY')
      .gte('issued_at', `${fromDate}T00:00:00`)
      .lte('issued_at', `${toDate}T23:59:59`)
      .in('status', ['PAID', 'PARTIALLY_PAID'])

    let totalRevenue = 0
    for (const inv of invoices || []) {
      totalRevenue += inv.paid_amount
    }

    return { totalRevenue, invoiceCount: invoices?.length || 0 }
  }
}
