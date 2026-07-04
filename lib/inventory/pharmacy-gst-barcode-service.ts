import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface GSTConfiguration {
  serviceType: string;
  hsn: string;
  sgstPercent: number;
  cgstPercent: number;
  igstPercent: number;
  description: string;
}

export interface TaxCalculation {
  amount: number;
  sgstPercent: number;
  cgstPercent: number;
  sgstAmount: number;
  cgstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export class GSTService {
  private static DEFAULT_GST_PERCENT = 5;

  static async getGSTConfiguration(serviceType: string): Promise<GSTConfiguration | null> {
    const supabase = getSupabase();

    const { data } = await supabase
      .from('bill_tax_configuration')
      .select('*')
      .eq('service_type', serviceType)
      .single();

    return data || null;
  }

  static async getAllGSTConfigurations(): Promise<GSTConfiguration[]> {
    const supabase = getSupabase();

    const { data } = await supabase
      .from('bill_tax_configuration')
      .select('*')
      .order('service_type');

    return data || [];
  }

  static async updateGSTConfiguration(
    serviceType: string,
    input: Partial<GSTConfiguration>
  ): Promise<GSTConfiguration | null> {
    const supabase = getSupabase();

    const { data } = await supabase
      .from('bill_tax_configuration')
      .update(input)
      .eq('service_type', serviceType)
      .select()
      .single();

    return data || null;
  }

  static calculateTax(amount: number, sgstPercent?: number, cgstPercent?: number): TaxCalculation {
    const sgst = sgstPercent || this.DEFAULT_GST_PERCENT / 2;
    const cgst = cgstPercent || this.DEFAULT_GST_PERCENT / 2;

    const sgstAmount = (amount * sgst) / 100;
    const cgstAmount = (amount * cgst) / 100;
    const totalTax = sgstAmount + cgstAmount;

    return {
      amount,
      sgstPercent: sgst,
      cgstPercent: cgst,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAmount: Math.round((amount + totalTax) * 100) / 100
    };
  }

  static calculateLineItemTax(
    quantity: number,
    unitPrice: number,
    sgstPercent?: number,
    cgstPercent?: number
  ): TaxCalculation {
    const amount = quantity * unitPrice;
    return this.calculateTax(amount, sgstPercent, cgstPercent);
  }

  static validateGSTIN(gstin: string): boolean {
    // GSTIN format: 29ABCDE1234F1Z5 (15 characters)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9]{1}[Z]{1}[0-9]{1}$/;
    return gstinRegex.test(gstin);
  }

  static generateGSTReport(fromDate: string, toDate: string): Promise<any> {
    return new Promise((resolve) => {
      // This would generate a detailed GST report
      resolve({
        period: `${fromDate} to ${toDate}`,
        totalBills: 0,
        totalTaxable: 0,
        totalSGST: 0,
        totalCGST: 0,
        totalIGST: 0,
        totalTax: 0
      });
    });
  }
}

export interface BarcodeData {
  productId: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  price: number;
  expiryDate: string;
}

export class BarcodeService {
  static async generateBarcode(data: BarcodeData): Promise<string> {
    // Generate barcode image URL using a service like BarcodeLookup or similar
    // For now, return a placeholder
    const barcodeData = `${data.productId}|${data.batchNumber}`;
    const encoded = encodeURIComponent(barcodeData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  }

  static async generateBarcodeLabel(product: any): Promise<string> {
    // Generate HTML for barcode label
    return `
      <div style="width: 100mm; height: 50mm; border: 1px solid #000; padding: 5px; font-family: Arial, sans-serif;">
        <div style="font-size: 10px; font-weight: bold;">${product.name}</div>
        <div style="font-size: 8px;">Batch: ${product.batchNumber}</div>
        <div style="font-size: 12px; font-weight: bold; margin: 5px 0;">₹${product.price}</div>
        <div style="text-align: center; margin-top: 5px;">
          <img src="${await this.generateBarcode(product)}" width="80" height="80" />
        </div>
      </div>
    `;
  }

  static async scanBarcode(barcodeValue: string): Promise<BarcodeData | null> {
    const supabase = getSupabase();

    // Try to find by product ID or batch number
    const { data: batch } = await supabase
      .from('inv_product_batches')
      .select(
        `batch_number, quantity_on_hand, expiry_date,
         product:inv_products(id, name, selling_price)`
      )
      .eq('batch_number', barcodeValue)
      .or(`product_id.eq.${barcodeValue}`)
      .single();

    if (!batch) return null;

    return {
      productId: batch.product?.id || '',
      productName: batch.product?.name || 'Unknown',
      batchNumber: batch.batch_number,
      quantity: batch.quantity_on_hand || 0,
      price: batch.product?.selling_price || 0,
      expiryDate: batch.expiry_date || ''
    };
  }

  static formatBarcodeForPrinting(data: BarcodeData[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; margin: 0; padding: 5mm; }
          .label { 
            width: 100mm; 
            height: 50mm; 
            border: 1px solid #000; 
            padding: 5mm; 
            margin-bottom: 5mm;
            page-break-after: always;
          }
          .barcode-img { max-width: 80mm; height: auto; }
        </style>
      </head>
      <body>
        ${data.map(item => `
          <div class="label">
            <div style="font-size: 10px; font-weight: bold;">${item.productName}</div>
            <div style="font-size: 8px;">Batch: ${item.batchNumber}</div>
            <div style="font-size: 12px; font-weight: bold;">₹${item.price}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
}
