/**
 * Pharmacy Bill Service — Phase 5
 * Handles pharmacy POS operations, billing, and inventory integration
 */

import { createClient } from '@supabase/supabase-js'

// Types
export interface Bill {
  uuid: string
  bill_number: string
  patient_uuid?: string
  doctor_uuid?: string
  cashier_uuid: string
  bill_date: string
  bill_time: string
  bill_type: string
  subtotal_amount: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  paid_amount: number
  balance_due: number
  bill_status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'
  payment_status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID'
  notes?: string
  created_at: string
  updated_at: string
  items?: BillItem[]
  payments?: BillPayment[]
}

export interface BillItem {
  uuid: string
  bill_uuid: string
  product_uuid: string
  batch_uuid?: string
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

export interface BillPayment {
  uuid: string
  bill_uuid: string
  payment_mode: 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'CREDIT' | 'SPLIT'
  amount_paid: number
  reference_number?: string
  payment_date: string
  payment_time: string
  payment_status: string
}

export interface CreateBillInput {
  patient_uuid?: string
  doctor_uuid?: string
  cashier_uuid: string
  items: CreateBillItemInput[]
  notes?: string
}

export interface CreateBillItemInput {
  product_uuid: string
  quantity: number
  unit_rate: number
  discount_type?: string
  discount_value?: number
  discount_percent?: number
  gst_percentage: number
  hsn_code?: string
}

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface BillListOptions {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  patient_uuid?: string
  cashier_uuid?: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export class PharmacyBillService {
  /**
   * Get all bills with pagination and filters
   */
  static async getBills(options: BillListOptions = {}): Promise<ListResponse<Bill>> {
    const {
      page = 1,
      pageSize = 50,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      patient_uuid = '',
      cashier_uuid = '',
    } = options

    try {
      let query = getSupabase()
        .from('ph_bills')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)

      if (search.trim()) {
        query = query.or(
          `bill_number.ilike.%${search}%,patient_uuid.eq.${search}`
        )
      }

      if (status) {
        query = query.eq('bill_status', status)
      }

      if (dateFrom) {
        query = query.gte('bill_date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('bill_date', dateTo)
      }

      if (patient_uuid) {
        query = query.eq('patient_uuid', patient_uuid)
      }

      if (cashier_uuid) {
        query = query.eq('cashier_uuid', cashier_uuid)
      }

      query = query.order('bill_date', { ascending: false })

      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Bill[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
      throw new Error('Failed to fetch bills')
    }
  }

  /**
   * Get single bill with items and payments
   */
  static async getBillById(id: string): Promise<Bill> {
    try {
      const { data: bill, error: billError } = await getSupabase()
        .from('ph_bills')
        .select('*')
        .eq('uuid', id)
        .eq('is_deleted', false)
        .single()

      if (billError) throw billError

      if (!bill) throw new Error('Bill not found')

      // Get items
      const { data: items, error: itemsError } = await getSupabase()
        .from('ph_bill_items')
        .select('*')
        .eq('bill_uuid', id)

      if (itemsError) throw itemsError

      // Get payments
      const { data: payments, error: paymentsError } = await getSupabase()
        .from('ph_bill_payments')
        .select('*')
        .eq('bill_uuid', id)

      if (paymentsError) throw paymentsError

      return {
        ...(bill as Bill),
        items: items as BillItem[],
        payments: payments as BillPayment[],
      }
    } catch (error) {
      console.error('Error fetching bill:', error)
      throw new Error('Failed to fetch bill')
    }
  }

  /**
   * Create a new bill in DRAFT status
   */
  static async createBill(input: CreateBillInput, userId?: string): Promise<Bill> {
    try {
      // Generate bill number
      const { data: billNumber, error: numberError } = await getSupabase()
        .rpc('fn_generate_bill_number')

      if (numberError) throw numberError

      // Calculate totals from items
      let subtotal = 0
      let totalTax = 0

      const lineItems = input.items.map((item) => {
        const lineAmount = item.quantity * item.unit_rate
        const discount = item.discount_value || 0
        const lineAfterDiscount = lineAmount - discount
        const tax = (lineAfterDiscount * item.gst_percentage) / 100
        const finalAmount = lineAfterDiscount + tax

        subtotal += lineAfterDiscount
        totalTax += tax

        // Split GST
        const splitTax = tax / 2 // Simplified: CGST + SGST

        return {
          product_uuid: item.product_uuid,
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

      // Create bill
      const { data: bill, error: billError } = await getSupabase()
        .from('ph_bills')
        .insert([
          {
            bill_number: billNumber,
            patient_uuid: input.patient_uuid || null,
            doctor_uuid: input.doctor_uuid || null,
            cashier_uuid: input.cashier_uuid,
            bill_status: 'DRAFT',
            payment_status: 'PENDING',
            subtotal_amount: subtotal,
            discount_amount: 0,
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

      if (billError) throw billError

      // Insert items
      const itemsWithBillId = lineItems.map((item) => ({
        ...item,
        bill_uuid: bill.uuid,
      }))

      const { error: itemsError } = await getSupabase()
        .from('ph_bill_items')
        .insert(itemsWithBillId)

      if (itemsError) throw itemsError

      // Audit log
      await this.logAudit(bill.uuid, 'CREATE', { bill_number: billNumber }, userId)

      return this.getBillById(bill.uuid)
    } catch (error) {
      console.error('Error creating bill:', error)
      throw new Error('Failed to create bill')
    }
  }

  /**
   * Update bill items (only in DRAFT status)
   */
  static async updateBillItems(
    billId: string,
    items: CreateBillItemInput[],
    userId?: string
  ): Promise<Bill> {
    try {
      const bill = await this.getBillById(billId)

      if (bill.bill_status !== 'DRAFT') {
        throw new Error('Can only edit draft bills')
      }

      // Delete existing items
      await getSupabase()
        .from('ph_bill_items')
        .delete()
        .eq('bill_uuid', billId)

      // Insert new items and recalculate
      return this.createBill(
        {
          patient_uuid: bill.patient_uuid,
          doctor_uuid: bill.doctor_uuid,
          cashier_uuid: bill.cashier_uuid,
          items,
          notes: bill.notes,
        },
        userId
      )
    } catch (error) {
      console.error('Error updating bill items:', error)
      throw new Error('Failed to update bill items')
    }
  }

  /**
   * Complete bill sale — atomically posts bill and deducts stock
   */
  static async completeSale(billId: string, userId?: string): Promise<Bill> {
    try {
      // Call atomic RPC function
      const { data, error } = await getSupabase().rpc('fn_post_sale', {
        p_bill_uuid: billId,
        p_user_uuid: userId || null,
      })

      if (error) throw error

      const result = data as {
        success: boolean
        bill_number: string
        items_processed: number
        movements_created: number
      }

      if (!result.success) {
        throw new Error('Failed to complete sale')
      }

      return this.getBillById(billId)
    } catch (error) {
      console.error('Error completing sale:', error)
      throw new Error('Failed to complete sale')
    }
  }

  /**
   * Record payment for a bill
   */
  static async recordPayment(
    billId: string,
    payment: {
      payment_mode: string
      amount_paid: number
      reference_number?: string
    },
    userId?: string
  ): Promise<BillPayment> {
    try {
      const { data, error } = await getSupabase()
        .from('ph_bill_payments')
        .insert([
          {
            bill_uuid: billId,
            payment_mode: payment.payment_mode,
            amount_paid: payment.amount_paid,
            reference_number: payment.reference_number,
            created_by: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Update bill payment status
      const bill = await this.getBillById(billId)
      const newPaidAmount = (bill.payments || []).reduce((sum, p) => sum + p.amount_paid, 0)

      let newStatus = 'PENDING'
      if (newPaidAmount >= bill.total_amount) {
        newStatus = 'PAID'
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL'
      }

      await getSupabase()
        .from('ph_bills')
        .update({
          paid_amount: newPaidAmount,
          balance_due: Math.max(0, bill.total_amount - newPaidAmount),
          payment_status: newStatus,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('uuid', billId)

      return data as BillPayment
    } catch (error) {
      console.error('Error recording payment:', error)
      throw new Error('Failed to record payment')
    }
  }

  /**
   * Cancel a draft bill
   */
  static async cancelBill(billId: string, reason: string, userId?: string): Promise<void> {
    try {
      const bill = await this.getBillById(billId)

      if (bill.bill_status !== 'DRAFT') {
        throw new Error('Can only cancel draft bills')
      }

      await getSupabase()
        .from('ph_bills')
        .update({
          bill_status: 'CANCELLED',
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('uuid', billId)

      await this.logAudit(billId, 'CANCEL', { reason }, userId)
    } catch (error) {
      console.error('Error cancelling bill:', error)
      throw new Error('Failed to cancel bill')
    }
  }

  /**
   * Audit logging
   */
  private static async logAudit(
    billId: string,
    action: string,
    newValue: any,
    userId?: string
  ): Promise<void> {
    try {
      await getSupabase()
        .from('ph_bill_audit_log')
        .insert({
          bill_uuid: billId,
          action,
          new_value: newValue,
          performed_by: userId,
        })
    } catch (error) {
      console.error('Error logging audit:', error)
      // Don't fail the operation if audit fails
    }
  }
}
