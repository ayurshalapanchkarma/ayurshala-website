import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export type InvoiceType = 'CONSULTATION' | 'PHARMACY' | 'PANCHAKARMA' | 'LAB' | 'PACKAGE' | 'MIXED'
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASHFREE' | 'CHEQUE' | 'MIXED_PAYMENT'
export type DiscountType = 'FLAT' | 'PERCENTAGE'

export interface InvoiceItem {
  itemType: string
  productId?: string
  serviceName?: string
  description?: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  discountPercentage?: number
  gstSlab?: number
  referenceId?: string
}

export interface CreateInvoiceInput {
  patientId: string
  invoiceType: InvoiceType
  consultationId?: string
  treatmentPlanId?: string
  referenceId?: string
  referenceType?: string
  items: InvoiceItem[]
  discountAmount?: number
  discountType?: DiscountType
  gstSlab?: number
  dueDate?: string
  notes?: string
}

export class FinanceService {
  /**
   * Create invoice
   */
  static async createInvoice(input: CreateInvoiceInput, userId: string): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.patientId?.trim()) errors.push({ field: 'patientId', message: 'Patient required' })
    if (!input.invoiceType) errors.push({ field: 'invoiceType', message: 'Invoice type required' })
    if (!input.items || input.items.length === 0) errors.push({ field: 'items', message: 'At least one item required' })

    if (errors.length > 0) throw new ValidationException(errors)

    const invoiceNumber = await this.generateInvoiceNumber()

    // Calculate totals
    let subtotal = 0
    const itemsData: any[] = []

    for (const item of input.items) {
      const lineSubtotal = item.quantity * item.unitPrice
      const discount = item.discountAmount || (item.discountPercentage ? (lineSubtotal * item.discountPercentage) / 100 : 0)
      const afterDiscount = lineSubtotal - discount
      const gstAmount = (afterDiscount * (item.gstSlab || 0)) / 100

      itemsData.push({
        invoice_id: null, // Will be set after invoice creation
        item_type: item.itemType,
        product_id: item.productId || null,
        service_name: item.serviceName || null,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: discount,
        discount_percentage: item.discountPercentage || 0,
        gst_amount: gstAmount,
        gst_slab: item.gstSlab || 0,
        line_total: afterDiscount + gstAmount,
        reference_id: item.referenceId || null,
      })

      subtotal += lineSubtotal
    }

    const totalDiscount = input.discountAmount || 0
    const afterDiscount = subtotal - totalDiscount
    const gstAmount = (afterDiscount * (input.gstSlab || 0)) / 100
    const totalAmount = afterDiscount + gstAmount

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        patient_id: input.patientId,
        invoice_type: input.invoiceType,
        consultation_id: input.consultationId || null,
        treatment_plan_id: input.treatmentPlanId || null,
        reference_id: input.referenceId || null,
        reference_type: input.referenceType || null,
        subtotal,
        discount_amount: totalDiscount,
        discount_type: input.discountType || null,
        gst_amount: gstAmount,
        gst_slab: input.gstSlab || 0,
        total_amount: totalAmount,
        outstanding_amount: totalAmount,
        due_date: input.dueDate || null,
        notes: input.notes || null,
        created_by: userId,
        status: 'DRAFT',
      })
      .select()
      .single()

    if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`)

    // Add items
    for (const item of itemsData) {
      item.invoice_id = invoice.id
    }

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(itemsData)

    if (itemsError) throw new Error(`Failed to add invoice items: ${itemsError.message}`)

    return this.getInvoice(invoice.id)
  }

  /**
   * Get invoice with items
   */
  static async getInvoice(invoiceId: string): Promise<any> {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('is_deleted', false)
      .single()

    const { data: items } = await supabaseAdmin
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('is_deleted', false)

    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('is_deleted', false)

    return { ...invoice, items: items || [], payments: payments || [] }
  }

  /**
   * Record payment
   */
  static async recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    userId: string,
    transactionId?: string,
  ): Promise<any> {
    // Get invoice
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('is_deleted', false)
      .single()

    if (!invoice) throw new Error('Invoice not found')
    if (invoice.status === 'CANCELLED') throw new Error('Cannot pay cancelled invoice')
    if (amount > invoice.outstanding_amount) throw new Error('Payment exceeds outstanding amount')

    const paymentNumber = await this.generatePaymentNumber()

    // Create payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_number: paymentNumber,
        invoice_id: invoiceId,
        patient_id: invoice.patient_id,
        amount,
        payment_method: paymentMethod,
        payment_status: 'SUCCESS',
        transaction_id: transactionId || null,
        received_by: userId,
      })
      .select()
      .single()

    if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`)

    // Create payment allocation
    await supabaseAdmin.from('payment_allocations').insert({
      payment_id: payment.id,
      invoice_id: invoiceId,
      allocated_amount: amount,
    })

    // Update invoice
    const newPaidAmount = invoice.paid_amount + amount
    const newOutstanding = invoice.total_amount - newPaidAmount
    const newStatus: InvoiceStatus =
      newOutstanding === 0
        ? 'PAID'
        : newPaidAmount > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID'

    await supabaseAdmin
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        outstanding_amount: newOutstanding,
        status: newStatus,
        paid_at: newOutstanding === 0 ? new Date() : null,
      })
      .eq('id', invoiceId)

    return payment
  }

  /**
   * Process refund
   */
  static async processRefund(invoiceId: string, refundAmount: number, reason: string, userId: string): Promise<any> {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('is_deleted', false)
      .single()

    if (!invoice) throw new Error('Invoice not found')
    if (refundAmount > invoice.paid_amount) throw new Error('Refund exceeds paid amount')

    const refundNumber = await this.generateRefundNumber()

    // Create refund
    const { data: refund, error: refundError } = await supabaseAdmin
      .from('refunds')
      .insert({
        refund_number: refundNumber,
        invoice_id: invoiceId,
        patient_id: invoice.patient_id,
        refund_amount: refundAmount,
        refund_reason: reason,
        status: 'SUCCESS',
        processed_by: userId,
      })
      .select()
      .single()

    if (refundError) throw new Error(`Failed to process refund: ${refundError.message}`)

    // Update invoice
    const newPaidAmount = invoice.paid_amount - refundAmount
    const newOutstanding = invoice.outstanding_amount + refundAmount
    const newStatus: InvoiceStatus =
      newOutstanding === invoice.total_amount
        ? 'UNPAID'
        : newPaidAmount > 0
          ? 'PARTIALLY_PAID'
          : 'REFUNDED'

    await supabaseAdmin
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        outstanding_amount: newOutstanding,
        status: newStatus,
      })
      .eq('id', invoiceId)

    return refund
  }

  /**
   * Get patient invoices
   */
  static async getPatientInvoices(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('issued_at', { ascending: false })

    return data || []
  }

  /**
   * Get outstanding invoices
   */
  static async getOutstandingInvoices(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])
      .eq('is_deleted', false)
      .order('issued_at', { ascending: true })

    return data || []
  }

  /**
   * Get today's revenue
   */
  static async getTodayRevenue(): Promise<any> {
    const today = new Date().toISOString().split('T')[0]

    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .gte('payment_date', `${today}T00:00:00`)
      .lte('payment_date', `${today}T23:59:59`)
      .eq('payment_status', 'SUCCESS')

    const totalCollected = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

    const { data: refunds } = await supabaseAdmin
      .from('refunds')
      .select('refund_amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('status', 'SUCCESS')

    const totalRefunded = refunds?.reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0) || 0

    return {
      totalCollected,
      totalRefunded,
      netRevenue: totalCollected - totalRefunded,
    }
  }

  /**
   * Get revenue by type
   */
  static async getRevenueByType(): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('invoice_type, total_amount, paid_amount')
      .in('status', ['PAID', 'PARTIALLY_PAID'])

    const revenue: Record<string, { total: number; paid: number }> = {}

    for (const inv of invoices || []) {
      if (!revenue[inv.invoice_type]) {
        revenue[inv.invoice_type] = { total: 0, paid: 0 }
      }
      revenue[inv.invoice_type].total += inv.total_amount
      revenue[inv.invoice_type].paid += inv.paid_amount
    }

    return revenue
  }

  /**
   * Purchase package
   */
  static async purchasePackage(packageId: string, patientId: string, invoiceId: string, userId: string): Promise<any> {
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (!pkg) throw new Error('Package not found')

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + pkg.validity_days)

    const { data: purchase, error } = await supabaseAdmin
      .from('package_purchases')
      .insert({
        package_id: packageId,
        patient_id: patientId,
        invoice_id: invoiceId,
        sessions_purchased: pkg.sessions_count,
        sessions_remaining: pkg.sessions_count,
        expiry_date: expiryDate.toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to purchase package: ${error.message}`)
    return purchase
  }

  /**
   * Consume package session
   */
  static async consumePackageSession(packagePurchaseId: string): Promise<any> {
    const { data: purchase } = await supabaseAdmin
      .from('package_purchases')
      .select('*')
      .eq('id', packagePurchaseId)
      .single()

    if (!purchase) throw new Error('Package purchase not found')
    if (purchase.sessions_remaining <= 0) throw new Error('No sessions remaining')

    const newRemaining = purchase.sessions_remaining - 1
    const newConsumed = purchase.sessions_consumed + 1

    const { data: updated } = await supabaseAdmin
      .from('package_purchases')
      .update({
        sessions_consumed: newConsumed,
        sessions_remaining: newRemaining,
        is_active: newRemaining > 0,
      })
      .eq('id', packagePurchaseId)
      .select()
      .single()

    return updated
  }

  /**
   * Get patient account summary
   */
  static async getPatientAccountSummary(patientId: string): Promise<any> {
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('total_amount, paid_amount, outstanding_amount, status')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)

    const totalBilled = invoices?.reduce((sum: number, i: any) => sum + i.total_amount, 0) || 0
    const totalPaid = invoices?.reduce((sum: number, i: any) => sum + i.paid_amount, 0) || 0
    const outstanding = invoices?.reduce((sum: number, i: any) => sum + i.outstanding_amount, 0) || 0

    const { data: packages } = await supabaseAdmin
      .from('package_purchases')
      .select('sessions_remaining, sessions_consumed')
      .eq('patient_id', patientId)
      .eq('is_active', true)

    const totalPackageSessions = packages?.reduce((sum: number, p: any) => sum + p.sessions_remaining, 0) || 0

    return {
      totalBilled,
      totalPaid,
      outstanding,
      invoiceCount: invoices?.length || 0,
      activePackages: packages?.length || 0,
      remainingPackageSessions: totalPackageSessions,
    }
  }

  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].invoice_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `INV-${year}-${seq}`
  }

  private static async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('payments')
      .select('payment_number')
      .like('payment_number', `PAY-${year}-%`)
      .order('payment_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].payment_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `PAY-${year}-${seq}`
  }

  private static async generateRefundNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('refunds')
      .select('refund_number')
      .like('refund_number', `RF-${year}-%`)
      .order('refund_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].refund_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `RF-${year}-${seq}`
  }
}
