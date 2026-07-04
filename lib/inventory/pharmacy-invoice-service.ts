import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface InvoiceData {
  billId: string;
  billNumber: string;
  billDate: string;
  patientName: string;
  patientPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  paymentModes: string[];
}

export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber: string;
}

export class PharmacyInvoiceService {
  static async getInvoiceData(billId: string): Promise<InvoiceData | null> {
    const supabase = getSupabase();

    const { data: bill } = await supabase
      .from('ph_bills')
      .select(
        `id, bill_number, total_amount, subtotal_amount, sgst_amount, cgst_amount, paid_amount, status, created_at,
         patient:patients(name, phone),
         items:ph_bill_items(product_id, quantity, unit_price,
           product:inv_products(name),
           batch:inv_product_batches(batch_number)
         ),
         payments:ph_bill_payments(payment_mode)`
      )
      .eq('id', billId)
      .single();

    if (!bill) return null;

    const invoiceItems: InvoiceItem[] = (bill.items || []).map((item: any) => ({
      medicineId: item.product_id,
      medicineName: item.product?.name || 'Unknown',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.unit_price * item.quantity,
      batchNumber: item.batch?.batch_number || ''
    }));

    return {
      billId: bill.id,
      billNumber: bill.bill_number,
      billDate: bill.created_at,
      patientName: bill.patient?.name || 'Walk-in Customer',
      patientPhone: bill.patient?.phone,
      items: invoiceItems,
      subtotal: bill.subtotal_amount || 0,
      tax: (bill.sgst_amount || 0) + (bill.cgst_amount || 0),
      total: bill.total_amount,
      paidAmount: bill.paid_amount || 0,
      pendingAmount: (bill.total_amount || 0) - (bill.paid_amount || 0),
      status: bill.status,
      paymentModes: (bill.payments || []).map((p: any) => p.payment_mode)
    };
  }

  static generatePDFHTML(invoice: InvoiceData): string {
    const tax = invoice.tax || 0;
    const taxPercent = invoice.subtotal > 0 ? (tax / invoice.subtotal * 100).toFixed(0) : '0';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.billNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
          .invoice { background: white; max-width: 800px; margin: 0 auto; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .clinic-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .invoice-info { display: flex; justify-content: space-between; margin-top: 20px; font-size: 12px; }
          .invoice-number { font-weight: bold; }
          .customer { margin-bottom: 30px; }
          .customer-label { font-weight: bold; color: #555; margin-bottom: 5px; }
          .customer-details { font-size: 14px; }
          table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
          th { background: #2c3e50; color: white; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
          tr:hover { background: #f9f9f9; }
          .amount { text-align: right; }
          .totals { margin-bottom: 30px; }
          .totals-row { display: flex; justify-content: flex-end; margin-bottom: 8px; font-size: 13px; }
          .totals-label { min-width: 150px; text-align: right; }
          .totals-value { min-width: 100px; text-align: right; font-weight: bold; }
          .total-row { display: flex; justify-content: flex-end; margin-bottom: 15px; font-size: 16px; font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; padding-top: 10px; padding-bottom: 10px; }
          .total-label { min-width: 150px; text-align: right; }
          .total-value { min-width: 100px; text-align: right; }
          .payment-status { margin-bottom: 20px; padding: 10px; background: #f0f0f0; border-left: 4px solid #27ae60; }
          .payment-status.pending { border-left-color: #e74c3c; }
          .footer { text-align: center; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 20px; }
          .barcode { text-align: center; margin: 20px 0; }
          .barcode-text { font-size: 10px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="clinic-name">AYURSHALA CLINIC</div>
            <div class="invoice-info">
              <span class="invoice-number">Invoice #${invoice.billNumber}</span>
              <span>Date: ${new Date(invoice.billDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div class="customer">
            <div class="customer-label">Bill To:</div>
            <div class="customer-details">
              <div>${invoice.patientName}</div>
              ${invoice.patientPhone ? `<div>Phone: ${invoice.patientPhone}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th class="amount">Qty</th>
                <th class="amount">Rate</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.medicineName}</td>
                  <td>${item.batchNumber}</td>
                  <td class="amount">${item.quantity}</td>
                  <td class="amount">₹${item.unitPrice.toFixed(2)}</td>
                  <td class="amount">₹${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <div class="totals-label">Subtotal:</div>
              <div class="totals-value">₹${invoice.subtotal.toFixed(2)}</div>
            </div>
            <div class="totals-row">
              <div class="totals-label">Tax (${taxPercent}%):</div>
              <div class="totals-value">₹${invoice.tax.toFixed(2)}</div>
            </div>
            <div class="total-row">
              <div class="total-label">Total Amount:</div>
              <div class="total-value">₹${invoice.total.toFixed(2)}</div>
            </div>
          </div>

          <div class="payment-status ${invoice.pendingAmount > 0 ? 'pending' : ''}">
            <strong>Payment Status:</strong> ${invoice.status}<br>
            Paid: ₹${invoice.paidAmount.toFixed(2)} | Pending: ₹${invoice.pendingAmount.toFixed(2)}
          </div>

          <div class="barcode">
            <div class="barcode-text">${invoice.billNumber}</div>
          </div>

          <div class="footer">
            <p>Thank you for your visit! Please keep this invoice for your records.</p>
            <p style="margin-top: 10px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateThermalHTML(invoice: InvoiceData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${invoice.billNumber}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; width: 80mm; }
          .receipt { padding: 10px; }
          .header { text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .receipt-no { text-align: center; font-size: 10px; margin-bottom: 10px; }
          .items { font-size: 9px; margin-bottom: 10px; }
          .item-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: right; }
          .item-price { width: 50px; text-align: right; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .total { text-align: right; font-weight: bold; margin-bottom: 5px; }
          .footer { text-align: center; font-size: 8px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">AYURSHALA CLINIC</div>
          <div class="receipt-no">Receipt #${invoice.billNumber}</div>

          <div class="items">
            ${invoice.items.map(item => `
              <div class="item-line">
                <div class="item-name">${item.medicineName.substring(0, 20)}</div>
                <div class="item-qty">${item.quantity}</div>
                <div class="item-price">₹${item.totalPrice.toFixed(0)}</div>
              </div>
            `).join('')}
          </div>

          <div class="divider"></div>
          <div class="total">SubTotal: ₹${invoice.subtotal.toFixed(2)}</div>
          <div class="total">Tax: ₹${invoice.tax.toFixed(2)}</div>
          <div class="total" style="font-size: 11px;">TOTAL: ₹${invoice.total.toFixed(2)}</div>
          <div class="divider"></div>

          <div style="text-align: center; font-size: 9px; margin-bottom: 10px;">
            ${invoice.paymentModes.join(', ')}
          </div>

          <div class="footer">
            ${new Date(invoice.billDate).toLocaleDateString('en-IN')} ${new Date(invoice.billDate).toLocaleTimeString('en-IN')}
            <br>
            Thank you!
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static async generateQRCode(billId: string): Promise<string> {
    // Generate QR code data URL
    // In production, use qrcode.react or similar library
    const qrData = encodeURIComponent(`Bill: ${billId}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  }

  static downloadPDF(html: string, filename: string) {
    if (typeof window === 'undefined') return;

    const element = document.createElement('a');
    const file = new Blob([html], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  static printInvoice(html: string, printType: 'pdf' | 'thermal' | 'a4' = 'a4') {
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) return;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Set appropriate margins for thermal or normal printing
    if (printType === 'thermal') {
      printWindow.document.body.style.margin = '0';
      printWindow.document.body.style.padding = '0';
    }

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  static async duplicateInvoice(billId: string): Promise<InvoiceData | null> {
    const supabase = getSupabase();

    const original = await this.getInvoiceData(billId);
    if (!original) return null;

    // Create a new bill with same items
    const { data: newBill } = await supabase
      .from('ph_bills')
      .insert({
        patient_id: original.billNumber,
        total_amount: original.total,
        subtotal_amount: original.subtotal,
        sgst_amount: 0,
        cgst_amount: 0,
        paid_amount: 0,
        status: 'DRAFT',
        is_deleted: false
      })
      .select()
      .single();

    if (!newBill) return null;

    return this.getInvoiceData(newBill.id);
  }

  static async reprintInvoice(billId: string, format: 'pdf' | 'thermal' | 'a4' = 'a4'): Promise<void> {
    const invoice = await this.getInvoiceData(billId);
    if (!invoice) throw new Error('Invoice not found');

    const html = format === 'thermal' 
      ? this.generateThermalHTML(invoice)
      : this.generatePDFHTML(invoice);

    this.printInvoice(html, format);
  }

  static async emailInvoice(billId: string, emailAddress: string): Promise<boolean> {
    // This would integrate with email service
    // For now, just return success
    try {
      const invoice = await this.getInvoiceData(billId);
      if (!invoice) return false;

      const html = this.generatePDFHTML(invoice);

      // Call email API endpoint
      const response = await fetch('/api/pharmacy/invoices/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId,
          emailAddress,
          html,
          subject: `Invoice ${invoice.billNumber}`
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  }
}
