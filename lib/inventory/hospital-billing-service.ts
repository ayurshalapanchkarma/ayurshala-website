/**
 * Hospital Billing Service — Phase 6
 * Handles hospital invoicing, patient ledger, and financial operations
 */

import { createClient } from '@supabase/supabase-js'

export interface Invoice {
  uuid: string
  invoice_number: string
  patient_uuid: string
  appointment_uuid?: string
  doctor_uuid?: string
  invoice_date: string
  invoice_time: string
  invoice_type: string
  subtotal_amount: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  invoice_status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  payment_status: string
  due_date?: string
  notes?: string
  created_at: string
  items?: InvoiceItem[]
  payments?: Payment[]
}

export interface InvoiceItem {
  uuid: string
  invoice_uuid: string
  item_type: string
  reference_uuid?: string
  description: string
  quantity: number
  unit_rate: number
  discount_type?: string
  discount_value: number
  discount_percent: number
  line_amount_before_tax: number
  gst_percentage: number
  gst_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  hsn_code?: string
  line_amount: number
}

export interface Payment {
  uuid: string
  invoice_uuid: string
  payment_mode: string
  amount_paid: number
  reference_number?: string
  payment_date: string
  payment_time: string
  payment_status: string
}

export interface PatientLedger {
  uuid: string
  patient_uuid: string
  transaction_type: string
  reference_uuid?: string
  description?: string
  debit_amount: number
  credit_amount: number
  balance_before: number
  balance_after: number
  transaction_date: string
}

export interface CreateInvoiceInput {
  patient_uuid: string
  appointment_uuid?: string
  doctor_uuid?: string
  invoice_type: string
  items: CreateInvoiceItemInput[]
  notes?: string
}

export interface CreateInvoiceItemInput {
  item_type: string
  reference_uuid?: string
  description: string
  quantity: number
  unit_rate: number
  discount_type?: string
  discount_value?: number
  discount_percent?: number
  gst_percentage: number
  hsn_code?: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export class HospitalBillingService {
  /**
   * Create a new invoice in DRAFT status
   */
  static async createInvoice(input: CreateInvoiceInput, userId?: string): Promise<Invoice> {
    try {
      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await getSupabase()
        .rpc('fn_generate_invoice_number')

      if (numberError) throw numberError

      // Calculate totals
      let subtotal = 0
      let totalTax = 0
      let totalDiscount = 0

      const lineItems = input.items.map((item) => {
        const lineAmount = item.quantity * item.unit_rate
        const discount = item.discount_value || 0
        const lineAfterDiscount = lineAmount - discount
        const tax = (lineAfterDiscount * item.gst_percentage) / 100
        const finalAmount = lineAfterDiscount + tax

        subtotal += lineAfterDiscount
        totalTax += tax
        totalDiscount += discount

        const splitTax = tax / 2

        return {
          item_type: item.item_type,
          reference_uuid: item.reference_uuid || null,
          description: item.description,
          quantity: item.quantity,
          unit_rate: item.unit_rate,
          discount_type: item.discount_type || 'NONE',
          discount_value: discount,
          discount_percent: item.discount_percent || 0,
          line_amount_before_tax: lineAfterDiscount,
          gst_percentage: item.gst_percentage,
          gst_amount: tax,
          cgst_amount: splitTax,
          sgst_amount: splitTax,
          igst_amount: 0,
          hsn_code: item.hsn_code,
          line_amount: finalAmount,
        }
      })

      // Create invoice
      const { data: invoice, error: invoiceError } = await getSupabase()
        .from('bill_invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            patient_uuid: input.patient_uuid,
            appointment_uuid: input.appointment_uuid || null,
            doctor_uuid: input.doctor_uuid || null,
            invoice_type: input.invoice_type,
            invoice_status: 'DRAFT',
            payment_status: 'PENDING',
            subtotal_amount: subtotal,
            discount_amount: totalDiscount,
            tax_amount: totalTax,
            total_amount: subtotal + totalTax,
            paid_amount: 0,
            balance_due: subtotal + totalTax,
            notes: input.notes,
            created_by: userId,
          },
        ])
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Insert items
      const itemsWithInvoiceId = lineItems.map((item) => ({
        ...item,
        invoice_uuid: invoice.uuid,
      }))

      const { error: itemsError } = await getSupabase()
        .from('bill_invoice_items')
        .insert(itemsWithInvoiceId)

      if (itemsError) throw itemsError

      // Audit log
      await this.logAudit(invoice.uuid, 'CREATE', { invoice_number: invoiceNumber }, userId)

      return this.getInvoiceById(invoice.uuid)
    } catch (error) {
      console.error('Error creating invoice:', error)
      throw new Error('Failed to create invoice')
    }
  }

  /**
   * Get invoice by ID with items and payments
   */
  static async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const { data: invoice, error: invoiceError } = await getSupabase()
        .from('bill_invoices')
        .select('*')
        .eq('uuid', id)
        .eq('is_deleted', false)
        .single()

      if (invoiceError) throw invoiceError

      if (!invoice) throw new Error('Invoice not found')

      // Get items
      const { data: items } = await getSupabase()
        .from('bill_invoice_items')
        .select('*')
        .eq('invoice_uuid', id)

      // Get payments
      const { data: payments } = await getSupabase()
        .from('bill_payments')
        .select('*')
        .eq('invoice_uuid', id)

      return {
        ...(invoice as Invoice),
        items: items as InvoiceItem[],
        payments: payments as Payment[],
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      throw new Error('Failed to fetch invoice')
    }
  }

  /**
   * Finalize invoice — atomically posts and creates ledger entry
   */
  static async finalizeInvoice(invoiceId: string, userId?: string): Promise<Invoice> {
    try {
      const { data, error } = await getSupabase().rpc('fn_finalize_invoice', {
        p_invoice_uuid: invoiceId,
        p_user_uuid: userId || null,
      })

      if (error) throw error

      const result = data as {
        success: boolean
        invoice_number: string
        total_amount: number
        patient_balance: number
      }

      if (!result.success) {
        throw new Error('Failed to finalize invoice')
      }

      return this.getInvoiceById(invoiceId)
    } catch (error) {
      console.error('Error finalizing invoice:', error)
      throw new Error('Failed to finalize invoice')
    }
  }

  /**
   * Record payment for invoice
   */
  static async recordPayment(
    invoiceId: string,
    payment: {
      payment_mode: string
      amount_paid: number
      reference_number?: string
    },
    userId?: string
  ): Promise<Payment> {
    try {
      const { data, error } = await getSupabase()
        .from('bill_payments')
        .insert([
          {
            invoice_uuid: invoiceId,
            payment_mode: payment.payment_mode,
            amount_paid: payment.amount_paid,
            reference_number: payment.reference_number,
            created_by: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Update invoice payment status
      const invoice = await this.getInvoiceById(invoiceId)
      const newPaidAmount = (invoice.payments || []).reduce((sum, p) => sum + p.amount_paid, 0) + payment.amount_paid

      let newStatus = 'PENDING'
      if (newPaidAmount >= invoice.total_amount) {
        newStatus = 'PAID'
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID'
      }

      await getSupabase()
        .from('bill_invoices')
        .update({
          paid_amount: newPaidAmount,
          balance_due: Math.max(0, invoice.total_amount - newPaidAmount),
          invoice_status: newStatus,
          payment_status: newStatus,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('uuid', invoiceId)

      // Update patient ledger
      const opening = await this.getPatientBalance(invoice.patient_uuid)
      const newBalance = opening - payment.amount_paid

      await getSupabase()
        .from('bill_patient_ledger')
        .insert({
          patient_uuid: invoice.patient_uuid,
          transaction_type: 'PAYMENT',
          reference_uuid: data.uuid,
          description: `Payment: ${payment.payment_mode}`,
          debit_amount: 0,
          credit_amount: payment.amount_paid,
          balance_before: opening,
          balance_after: newBalance,
          transaction_date: new Date().toISOString().split('T')[0],
        })

      await this.logAudit(invoiceId, 'PAYMENT', { amount: payment.amount_paid, mode: payment.payment_mode }, userId)

      return data as Payment
    } catch (error) {
      console.error('Error recording payment:', error)
      throw new Error('Failed to record payment')
    }
  }

  /**
   * Get patient ledger
   */
  static async getPatientLedger(patientId: string): Promise<PatientLedger[]> {
    try {
      const { data, error } = await getSupabase()
        .from('bill_patient_ledger')
        .select('*')
        .eq('patient_uuid', patientId)
        .order('transaction_date', { ascending: false })

      if (error) throw error

      return data as PatientLedger[]
    } catch (error) {
      console.error('Error fetching patient ledger:', error)
      throw new Error('Failed to fetch patient ledger')
    }
  }

  /**
   * Get patient outstanding balance
   */
  static async getPatientBalance(patientId: string): Promise<number> {
    try {
      const { data } = await getSupabase()
        .from('bill_patient_ledger')
        .select('balance_after')
        .eq('patient_uuid', patientId)
        .order('transaction_date', { ascending: false })
        .limit(1)
        .single()

      return data?.balance_after || 0
    } catch (error) {
      console.error('Error fetching patient balance:', error)
      return 0
    }
  }

  /**
   * Get invoices for patient
   */
  static async getPatientInvoices(patientId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await getSupabase()
        .from('bill_invoices')
        .select('*')
        .eq('patient_uuid', patientId)
        .eq('is_deleted', false)
        .order('invoice_date', { ascending: false })

      if (error) throw error

      return data as Invoice[]
    } catch (error) {
      console.error('Error fetching patient invoices:', error)
      throw new Error('Failed to fetch invoices')
    }
  }

  /**
   * Cancel invoice (only DRAFT)
   */
  static async cancelInvoice(invoiceId: string, reason: string, userId?: string): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(invoiceId)

      if (invoice.invoice_status !== 'DRAFT') {
        throw new Error('Can only cancel draft invoices')
      }

      await getSupabase()
        .from('bill_invoices')
        .update({
          invoice_status: 'CANCELLED',
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('uuid', invoiceId)

      await this.logAudit(invoiceId, 'CANCELLATION', { reason }, userId)
    } catch (error) {
      console.error('Error cancelling invoice:', error)
      throw new Error('Failed to cancel invoice')
    }
  }

  /**
   * Audit logging
   */
  private static async logAudit(
    invoiceId: string,
    action: string,
    newValue: any,
    userId?: string
  ): Promise<void> {
    try {
      await getSupabase()
        .from('bill_audit_log')
        .insert({
          invoice_uuid: invoiceId,
          action,
          new_value: newValue,
          user_uuid: userId,
        })
    } catch (error) {
      // Don't fail the operation if audit fails
    }
  }
}
