import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  paymentMode?: string;
  doctorId?: string;
  patientId?: string;
  medicineId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface DailySalesReport {
  date: string;
  billsCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  averageBill: number;
  paymentModes: Record<string, number>;
}

export interface MedicineSalesReport {
  medicineId: string;
  medicineName: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  batchesUsed: number;
  topBatch: string;
}

export interface PatientSalesReport {
  patientId: string;
  patientName: string;
  phone: string;
  billsCount: number;
  totalSpent: number;
  averageBill: number;
  lastBillDate: string;
}

export interface PaymentReport {
  paymentMode: string;
  count: number;
  totalAmount: number;
  averageAmount: number;
}

export interface ReturnReport {
  returnId: string;
  returnNumber: string;
  billNumber: string;
  returnReason: string;
  returnType: string;
  refundAmount: number;
  returnedDate: string;
  itemsCount: number;
}

export interface DiscountReport {
  discountType: string;
  count: number;
  totalDiscount: number;
  averageDiscount: number;
  applicableTo: string;
}

export interface GSTReport {
  billId: string;
  billNumber: string;
  billDate: string;
  subTotal: number;
  sgstAmount: number;
  cgstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export interface ConsumptionReport {
  date: string;
  medicineId: string;
  medicineName: string;
  quantityConsumed: number;
  batchNumber: string;
  expiryDate: string;
  referenceType: string;
  referenceId: string;
}

export interface ProfitReport {
  medicineId: string;
  medicineName: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

export class PharmacyReportService {
  static async getDailySalesReport(filters: ReportFilters = {}): Promise<DailySalesReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: bills } = await supabase
      .from('ph_bills')
      .select('id, total_amount, paid_amount, status, created_at, payments:ph_bill_payments(payment_mode, amount)')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .eq('is_deleted', false);

    if (!bills) return [];

    const dateMap = new Map<string, DailySalesReport>();

    bills.forEach((bill: any) => {
      const date = bill.created_at.split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          billsCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          averageBill: 0,
          paymentModes: {}
        });
      }

      const report = dateMap.get(date)!;
      report.billsCount += 1;
      report.totalAmount += bill.total_amount || 0;
      report.paidAmount += bill.paid_amount || 0;
      report.pendingAmount += (bill.total_amount || 0) - (bill.paid_amount || 0);

      (bill.payments || []).forEach((p: any) => {
        const mode = p.payment_mode || 'CASH';
        report.paymentModes[mode] = (report.paymentModes[mode] || 0) + (p.amount || 0);
      });
    });

    const result: DailySalesReport[] = [];
    dateMap.forEach((report) => {
      report.averageBill = report.billsCount > 0 ? report.totalAmount / report.billsCount : 0;
      result.push(report);
    });

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  static async getMedicineSalesReport(filters: ReportFilters = {}): Promise<MedicineSalesReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: billItems } = await supabase
      .from('ph_bill_items')
      .select(
        `product_id, quantity, unit_price, batch_id,
         bill:ph_bills(created_at, is_deleted),
         product:inv_products(name),
         batch:inv_product_batches(batch_number)`
      )
      .gte('bill:ph_bills.created_at', `${fromDate}T00:00:00`)
      .lte('bill:ph_bills.created_at', `${toDate}T23:59:59`)
      .eq('bill:ph_bills.is_deleted', false);

    if (!billItems) return [];

    const medicineMap = new Map<string, MedicineSalesReport>();

    billItems.forEach((item: any) => {
      if (!item.bill || item.bill.is_deleted) return;

      const key = item.product_id;
      if (!medicineMap.has(key)) {
        medicineMap.set(key, {
          medicineId: item.product_id,
          medicineName: item.product?.name || 'Unknown',
          quantitySold: 0,
          revenue: 0,
          averagePrice: 0,
          batchesUsed: 0,
          topBatch: ''
        });
      }

      const report = medicineMap.get(key)!;
      report.quantitySold += item.quantity || 0;
      report.revenue += (item.unit_price || 0) * (item.quantity || 0);
      report.topBatch = item.batch?.batch_number || report.topBatch;
    });

    const result: MedicineSalesReport[] = [];
    medicineMap.forEach((report) => {
      report.averagePrice = report.quantitySold > 0 ? report.revenue / report.quantitySold : 0;
      report.batchesUsed = new Set(
        billItems
          .filter((item: any) => item.product_id === report.medicineId)
          .map((item: any) => item.batch_id)
      ).size;
      result.push(report);
    });

    return result.sort((a, b) => b.revenue - a.revenue);
  }

  static async getPatientSalesReport(filters: ReportFilters = {}): Promise<PatientSalesReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: bills } = await supabase
      .from('ph_bills')
      .select(
        `id, patient_id, total_amount, created_at,
         patient:patients(name, phone)`
      )
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .eq('is_deleted', false);

    if (!bills) return [];

    const patientMap = new Map<string, PatientSalesReport>();

    bills.forEach((bill: any) => {
      if (!bill.patient_id) return;

      const key = bill.patient_id;
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          patientId: bill.patient_id,
          patientName: bill.patient?.name || 'Unknown',
          phone: bill.patient?.phone || '',
          billsCount: 0,
          totalSpent: 0,
          averageBill: 0,
          lastBillDate: bill.created_at
        });
      }

      const report = patientMap.get(key)!;
      report.billsCount += 1;
      report.totalSpent += bill.total_amount || 0;
      report.lastBillDate = bill.created_at > report.lastBillDate ? bill.created_at : report.lastBillDate;
    });

    const result: PatientSalesReport[] = [];
    patientMap.forEach((report) => {
      report.averageBill = report.billsCount > 0 ? report.totalSpent / report.billsCount : 0;
      result.push(report);
    });

    return result.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  static async getPaymentReport(filters: ReportFilters = {}): Promise<PaymentReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: payments } = await supabase
      .from('ph_bill_payments')
      .select('payment_mode, amount')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`);

    if (!payments) return [];

    const modeMap = new Map<string, PaymentReport>();

    payments.forEach((payment: any) => {
      const mode = payment.payment_mode || 'CASH';
      if (!modeMap.has(mode)) {
        modeMap.set(mode, {
          paymentMode: mode,
          count: 0,
          totalAmount: 0,
          averageAmount: 0
        });
      }

      const report = modeMap.get(mode)!;
      report.count += 1;
      report.totalAmount += payment.amount || 0;
    });

    const result: PaymentReport[] = [];
    modeMap.forEach((report) => {
      report.averageAmount = report.count > 0 ? report.totalAmount / report.count : 0;
      result.push(report);
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  static async getReturnReport(filters: ReportFilters = {}): Promise<ReturnReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: returns } = await supabase
      .from('ph_bill_returns')
      .select(
        `id, return_number, bill_id, return_reason, return_type, refund_amount, created_at,
         items:ph_bill_return_items(id),
         bill:ph_bills(bill_number)`
      )
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .eq('status', 'posted');

    if (!returns) return [];

    return returns.map((r: any) => ({
      returnId: r.id,
      returnNumber: r.return_number,
      billNumber: r.bill?.bill_number || '',
      returnReason: r.return_reason,
      returnType: r.return_type,
      refundAmount: r.refund_amount,
      returnedDate: r.created_at,
      itemsCount: (r.items || []).length
    }));
  }

  static async getDiscountReport(filters: ReportFilters = {}): Promise<DiscountReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: discounts } = await supabase
      .from('ph_bill_discounts')
      .select('discount_type, discount_amount, applicable_to')
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .eq('is_deleted', false);

    if (!discounts) return [];

    const discountMap = new Map<string, DiscountReport>();

    discounts.forEach((discount: any) => {
      const type = discount.discount_type || 'FLAT';
      if (!discountMap.has(type)) {
        discountMap.set(type, {
          discountType: type,
          count: 0,
          totalDiscount: 0,
          averageDiscount: 0,
          applicableTo: discount.applicable_to || ''
        });
      }

      const report = discountMap.get(type)!;
      report.count += 1;
      report.totalDiscount += discount.discount_amount || 0;
    });

    const result: DiscountReport[] = [];
    discountMap.forEach((report) => {
      report.averageDiscount = report.count > 0 ? report.totalDiscount / report.count : 0;
      result.push(report);
    });

    return result;
  }

  static async getGSTReport(filters: ReportFilters = {}): Promise<GSTReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: bills } = await supabase
      .from('ph_bills')
      .select(
        `id, bill_number, subtotal_amount, sgst_amount, cgst_amount, total_amount, created_at`
      )
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .eq('is_deleted', false)
      .eq('status', 'COMPLETED');

    if (!bills) return [];

    return bills.map((b: any) => ({
      billId: b.id,
      billNumber: b.bill_number,
      billDate: b.created_at,
      subTotal: b.subtotal_amount || 0,
      sgstAmount: b.sgst_amount || 0,
      cgstAmount: b.cgst_amount || 0,
      totalTax: (b.sgst_amount || 0) + (b.cgst_amount || 0),
      totalAmount: b.total_amount
    }));
  }

  static async getConsumptionReport(filters: ReportFilters = {}): Promise<ConsumptionReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: movements } = await supabase
      .from('inv_stock_movements')
      .select(
        `id, product_id, batch_id, quantity_moved, movement_type, reference_type, reference_id, created_at,
         product:inv_products(name),
         batch:inv_product_batches(batch_number, expiry_date)`
      )
      .gte('created_at', `${fromDate}T00:00:00`)
      .lte('created_at', `${toDate}T23:59:59`)
      .in('movement_type', ['SALE', 'TREATMENT_CONSUMPTION'])
      .eq('is_deleted', false);

    if (!movements) return [];

    return movements.map((m: any) => ({
      date: m.created_at,
      medicineId: m.product_id,
      medicineName: m.product?.name || 'Unknown',
      quantityConsumed: m.quantity_moved,
      batchNumber: m.batch?.batch_number || '',
      expiryDate: m.batch?.expiry_date || '',
      referenceType: m.reference_type,
      referenceId: m.reference_id
    }));
  }

  static async getProfitReport(filters: ReportFilters = {}): Promise<ProfitReport[]> {
    const supabase = getSupabase();
    const fromDate = filters.fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const toDate = filters.toDate || new Date().toISOString().split('T')[0];

    const { data: billItems } = await supabase
      .from('ph_bill_items')
      .select(
        `product_id, quantity, unit_price, cost_price,
         bill:ph_bills(created_at, is_deleted),
         product:inv_products(name)`
      )
      .gte('bill:ph_bills.created_at', `${fromDate}T00:00:00`)
      .lte('bill:ph_bills.created_at', `${toDate}T23:59:59`)
      .eq('bill:ph_bills.is_deleted', false);

    if (!billItems) return [];

    const profitMap = new Map<string, ProfitReport>();

    billItems.forEach((item: any) => {
      if (!item.bill || item.bill.is_deleted) return;

      const key = item.product_id;
      if (!profitMap.has(key)) {
        profitMap.set(key, {
          medicineId: item.product_id,
          medicineName: item.product?.name || 'Unknown',
          unitsSold: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          profitMargin: 0
        });
      }

      const report = profitMap.get(key)!;
      report.unitsSold += item.quantity || 0;
      const revenue = (item.unit_price || 0) * (item.quantity || 0);
      const cost = (item.cost_price || 0) * (item.quantity || 0);
      report.totalRevenue += revenue;
      report.totalCost += cost;
      report.totalProfit += revenue - cost;
    });

    const result: ProfitReport[] = [];
    profitMap.forEach((report) => {
      report.profitMargin = report.totalRevenue > 0 ? (report.totalProfit / report.totalRevenue) * 100 : 0;
      result.push(report);
    });

    return result.sort((a, b) => b.totalProfit - a.totalProfit);
  }

  static async getInventoryLinkageReport(filters: ReportFilters = {}): Promise<any> {
    const supabase = getSupabase();

    const { data: products } = await supabase
      .from('inv_products')
      .select(
        `id, name, 
         batches:inv_product_batches(quantity_on_hand, batch_number),
         sold:ph_bill_items(quantity)`
      )
      .eq('is_deleted', false)
      .limit(100);

    if (!products) return [];

    return products.map((p: any) => {
      const totalQty = (p.batches || []).reduce((sum: number, b: any) => sum + (b.quantity_on_hand || 0), 0);
      const totalSold = (p.sold || []).reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

      return {
        productId: p.id,
        productName: p.name,
        totalStockAvailable: totalQty,
        totalSoldThisMonth: totalSold,
        stockTurnover: totalQty > 0 ? totalSold / totalQty : 0,
        batches: (p.batches || []).map((b: any) => ({
          batchNumber: b.batch_number,
          quantityOnHand: b.quantity_on_hand
        }))
      };
    });
  }
}
