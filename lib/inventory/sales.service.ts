import { supabaseAdmin } from '@/lib/supabase-admin'
import { InventoryEngineService } from './inventory-engine.service'
import { FIFOService } from './fifo.service'
import { ValidationException } from './types'

export type CustomerType = 'PATIENT' | 'WALK_IN' | 'EMPLOYEE' | 'INTERNAL_USE'
export type SaleStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED'

export interface SaleItem {
  productId: string
  quantity: number
  sellingPrice?: number
}

export interface CreateSaleInput {
  customerType: CustomerType
  patientId?: string
  customerName?: string
  customerPhone?: string
  items: SaleItem[]
  notes?: string
}

export interface Sale {
  id: string
  invoiceNumber: string
  customerType: CustomerType
  patientId?: string
  customerName?: string
  status: SaleStatus
  totalAmount: number
  paidAmount: number
  createdAt: string
}

export class SalesService {
  /**
   * Create and process a sale
   * Automatically reduces inventory via InventoryEngineService
   */
  static async createSale(input: CreateSaleInput, userId: string): Promise<Sale> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.customerType) errors.push({ field: 'customerType', message: 'Customer type required' })
    if (!input.items || input.items.length === 0) errors.push({ field: 'items', message: 'At least one item required' })

    if (errors.length > 0) throw new ValidationException(errors)

    // Validate items
    for (const item of input.items) {
      if (!item.productId?.trim()) errors.push({ field: 'items', message: 'Product ID required' })
      if (item.quantity <= 0) errors.push({ field: 'items', message: 'Quantity must be > 0' })
    }

    if (errors.length > 0) throw new ValidationException(errors)

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber()

    // Calculate totals
    let subtotal = 0
    let totalGst = 0

    for (const item of input.items) {
      const { data: product } = await supabaseAdmin
        .from('inventory_products')
        .select('mrp, gst_percent, sale_price')
        .eq('id', item.productId)
        .single()

      if (!product) throw new Error(`Product ${item.productId} not found`)

      const price = item.sellingPrice || product.sale_price
      const lineTotal = price * item.quantity
      const gstAmount = (lineTotal * product.gst_percent) / 100

      subtotal += lineTotal
      totalGst += gstAmount
    }

    const totalAmount = subtotal + totalGst

    // Create sale record
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        invoice_number: invoiceNumber,
        customer_type: input.customerType,
        patient_id: input.patientId || null,
        customer_name: input.customerName || null,
        customer_phone: input.customerPhone || null,
        total_items: input.items.length,
        subtotal,
        gst_amount: totalGst,
        total_amount: totalAmount,
        status: 'DRAFT',
        notes: input.notes || null,
        created_by: userId,
      })
      .select()
      .single()

    if (saleError) throw new Error(`Failed to create sale: ${saleError.message}`)
    if (!sale) throw new Error('Failed to create sale')

    // Add items to sale
    for (const item of input.items) {
      const { data: product } = await supabaseAdmin
        .from('inventory_products')
        .select('mrp, gst_percent, sale_price')
        .eq('id', item.productId)
        .single()

      if (!product) throw new Error(`Product ${item.productId} not found`)

      const sellingPrice = item.sellingPrice || product.sale_price
      const lineTotal = sellingPrice * item.quantity

      await supabaseAdmin
        .from('sale_items')
        .insert({
          sale_id: sale.id,
          product_id: item.productId,
          quantity: item.quantity,
          mrp: product.mrp,
          selling_price: sellingPrice,
          gst_percent: product.gst_percent,
          line_total: lineTotal,
        })
    }

    return {
      id: sale.id,
      invoiceNumber: sale.invoice_number,
      customerType: sale.customer_type,
      patientId: sale.patient_id,
      customerName: sale.customer_name,
      status: sale.status,
      totalAmount: sale.total_amount,
      paidAmount: sale.paid_amount,
      createdAt: sale.created_at,
    }
  }

  /**
   * Complete sale and process inventory reduction via InventoryEngineService
   */
  static async completeSale(saleId: string): Promise<Sale> {
    // Get sale and items
    const { data: sale } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()

    if (!sale) throw new Error('Sale not found')

    const { data: items } = await supabaseAdmin
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)

    // For each item, reduce inventory via FIFO
    for (const item of items || []) {
      const fifoList = await FIFOService.getFIFOBatches(item.product_id, item.quantity)

      for (const consumption of fifoList) {
        await InventoryEngineService.recordMovement(
          {
            productId: item.product_id,
            batchId: consumption.batchId,
            movementType: 'SALE',
            quantityOut: consumption.quantityToConsume,
            referenceId: sale.id,
            referenceType: 'SALES_INVOICE',
            referenceNumber: sale.invoice_number,
            remarks: `Sold to ${sale.customer_name || 'Walk-in'}`,
          },
          sale.created_by,
        )
      }
    }

    // Update sale status
    const { data: updated } = await supabaseAdmin
      .from('sales')
      .update({ status: 'PAID', paid_amount: sale.total_amount })
      .eq('id', saleId)
      .select()
      .single()

    if (!updated) throw new Error('Failed to complete sale')

    return {
      id: updated.id,
      invoiceNumber: updated.invoice_number,
      customerType: updated.customer_type,
      patientId: updated.patient_id,
      customerName: updated.customer_name,
      status: updated.status,
      totalAmount: updated.total_amount,
      paidAmount: updated.paid_amount,
      createdAt: updated.created_at,
    }
  }

  /**
   * Get sale with items
   */
  static async getSaleById(saleId: string): Promise<any> {
    const { data: sale } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()

    const { data: items } = await supabaseAdmin
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)

    return {
      ...sale,
      items: items || [],
    }
  }

  /**
   * Get patient medicine history
   */
  static async getPatientMedicineHistory(patientId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('sales')
      .select(
        `
        id, invoice_number, sale_date, total_amount,
        sale_items(
          product_id,
          quantity,
          selling_price,
          inventory_products(name, sku)
        )
      `,
      )
      .eq('patient_id', patientId)
      .eq('status', 'PAID')
      .order('sale_date', { ascending: false })

    return (data || []).map(sale => ({
      invoiceNumber: sale.invoice_number,
      date: sale.sale_date,
      totalAmount: sale.total_amount,
      items: sale.sale_items.map((si: any) => ({
        productName: si.inventory_products.name,
        productSku: si.inventory_products.sku,
        quantity: si.quantity,
        price: si.selling_price,
      })),
    }))
  }

  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data } = await supabaseAdmin
      .from('sales')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    const lastSeq = data?.length ? parseInt(data[0].invoice_number.slice(-6)) : 0
    const seq = String(lastSeq + 1).padStart(6, '0')
    return `INV-${year}-${seq}`
  }
}
