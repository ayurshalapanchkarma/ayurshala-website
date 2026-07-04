import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface DashboardMetrics {
  todaysSales: number;
  todaysRevenue: number;
  todaysBills: number;
  pendingPayments: number;
  todaysRefunds: number;
  averageBillAmount: number;
  lowStockItems: number;
  expiringBatches: number;
  topMedicines: TopMedicine[];
  recentBills: RecentBill[];
  paymentModeSummary: PaymentModeSummary;
  hourlyRevenue: HourlyRevenue[];
  paymentModeChart: PaymentModeChart[];
}

export interface TopMedicine {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface RecentBill {
  billId: string;
  billNumber: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
}

export interface PaymentModeSummary {
  cash: number;
  upi: number;
  card: number;
  cheque: number;
  credit: number;
  total: number;
}

export interface HourlyRevenue {
  hour: number;
  revenue: number;
  bills: number;
}

export interface PaymentModeChart {
  mode: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DashboardFilter {
  fromDate?: string;
  toDate?: string;
  paymentMode?: string;
  doctorId?: string;
}

export class PharmacyDashboardService {
  static async getDashboardMetrics(filter?: DashboardFilter): Promise<DashboardMetrics> {
    const supabase = getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];

    const [
      { data: todaysBills },
      { data: allPayments },
      { data: refunds },
      { data: batches },
      { data: topMedicines },
      { data: recentBills }
    ] = await Promise.all([
      supabase
        .from('ph_bills')
        .select('id, total_amount, paid_amount, status, created_at')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${tomorrowStr}T00:00:00`)
        .eq('is_deleted', false),

      supabase
        .from('ph_bill_payments')
        .select('id, amount, payment_mode, created_at')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${tomorrowStr}T00:00:00`),

      supabase
        .from('ph_bill_returns')
        .select('id, refund_amount, created_at')
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${tomorrowStr}T00:00:00`)
        .eq('status', 'posted'),

      supabase
        .from('inv_product_batches')
        .select('id, expiry_date')
        .eq('is_deleted', false)
        .lt('expiry_date', new Date(today.getTime() + 7 * 86400000).toISOString()),

      supabase
        .from('ph_bill_items')
        .select('product_id, quantity, unit_price, product:inv_products(name)')
        .eq('bill:ph_bills.is_deleted', false)
        .gte('bill:ph_bills.created_at', `${todayStr}T00:00:00`)
        .lt('bill:ph_bills.created_at', `${tomorrowStr}T00:00:00`)
        .limit(10),

      supabase
        .from('ph_bills')
        .select(
          `id, bill_number, total_amount, paid_amount, status, created_at,
           patient:patients(name)`
        )
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${tomorrowStr}T00:00:00`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const todaysSalesCount = (todaysBills || []).length;
    const todaysRevenue = (todaysBills || []).reduce((sum, b: any) => sum + (b.paid_amount || 0), 0);
    const pendingPayments = (todaysBills || []).filter((b: any) => b.status === 'PENDING_PAYMENT' || b.status === 'PARTIALLY_PAID').length;
    const todaysRefundAmount = (refunds || []).reduce((sum, r: any) => sum + (r.refund_amount || 0), 0);

    const averageBillAmount = todaysSalesCount > 0 ? todaysRevenue / todaysSalesCount : 0;

    // Low stock items
    const { data: lowStockData } = await supabase
      .from('inv_stock_movements')
      .select('product_id, quantity_on_hand')
      .eq('is_active', true)
      .lt('quantity_on_hand', 'reorder_level')
      .limit(100);

    const lowStockItems = lowStockData?.length || 0;
    const expiringBatches = (batches || []).length;

    // Payment mode summary
    const paymentModeSummary = this.calculatePaymentModeSummary(allPayments || []);

    // Top medicines
    const topMedicinesList: TopMedicine[] = [];
    if (topMedicines && Array.isArray(topMedicines)) {
      const medicineMap = new Map<string, { name: string; qty: number; revenue: number }>();
      topMedicines.forEach((item: any) => {
        const key = item.product_id;
        if (!medicineMap.has(key)) {
          medicineMap.set(key, { name: item.product?.name || 'Unknown', qty: 0, revenue: 0 });
        }
        const med = medicineMap.get(key)!;
        med.qty += item.quantity || 0;
        med.revenue += (item.unit_price || 0) * (item.quantity || 0);
      });

      medicineMap.forEach((med, productId) => {
        topMedicinesList.push({
          productId,
          productName: med.name,
          quantitySold: med.qty,
          revenue: med.revenue
        });
      });
    }

    topMedicinesList.sort((a, b) => b.revenue - a.revenue);

    // Recent bills
    const recentBillsList: RecentBill[] = (recentBills || []).map((b: any) => ({
      billId: b.id,
      billNumber: b.bill_number,
      patientName: b.patient?.name || 'Walk-in',
      totalAmount: b.total_amount,
      paidAmount: b.paid_amount,
      status: b.status,
      createdAt: b.created_at
    }));

    // Hourly revenue
    const hourlyRevenue = this.calculateHourlyRevenue(todaysBills || []);

    // Payment mode chart
    const paymentModeChart = this.calculatePaymentModeChart(allPayments || []);

    return {
      todaysSales: todaysSalesCount,
      todaysRevenue,
      todaysBills: todaysSalesCount,
      pendingPayments,
      todaysRefunds: todaysRefundAmount,
      averageBillAmount,
      lowStockItems,
      expiringBatches,
      topMedicines: topMedicinesList.slice(0, 5),
      recentBills: recentBillsList,
      paymentModeSummary,
      hourlyRevenue,
      paymentModeChart
    };
  }

  private static calculatePaymentModeSummary(payments: any[]): PaymentModeSummary {
    const summary: PaymentModeSummary = {
      cash: 0,
      upi: 0,
      card: 0,
      cheque: 0,
      credit: 0,
      total: 0
    };

    payments.forEach((p: any) => {
      const amount = p.amount || 0;
      const mode = (p.payment_mode || '').toUpperCase();

      if (mode === 'CASH') summary.cash += amount;
      else if (mode === 'UPI') summary.upi += amount;
      else if (mode === 'CARD') summary.card += amount;
      else if (mode === 'CHEQUE') summary.cheque += amount;
      else if (mode === 'CREDIT') summary.credit += amount;

      summary.total += amount;
    });

    return summary;
  }

  private static calculateHourlyRevenue(bills: any[]): HourlyRevenue[] {
    const hourMap = new Map<number, { revenue: number; count: number }>();

    for (let i = 0; i < 24; i++) {
      hourMap.set(i, { revenue: 0, count: 0 });
    }

    bills.forEach((b: any) => {
      if (b.created_at) {
        const hour = new Date(b.created_at).getHours();
        const data = hourMap.get(hour) || { revenue: 0, count: 0 };
        data.revenue += b.paid_amount || 0;
        data.count += 1;
        hourMap.set(hour, data);
      }
    });

    const result: HourlyRevenue[] = [];
    hourMap.forEach((data, hour) => {
      result.push({
        hour,
        revenue: data.revenue,
        bills: data.count
      });
    });

    return result.sort((a, b) => a.hour - b.hour);
  }

  private static calculatePaymentModeChart(payments: any[]): PaymentModeChart[] {
    const modeMap = new Map<string, { amount: number; count: number }>();
    let total = 0;

    payments.forEach((p: any) => {
      const mode = p.payment_mode || 'CASH';
      const amount = p.amount || 0;
      const data = modeMap.get(mode) || { amount: 0, count: 0 };
      data.amount += amount;
      data.count += 1;
      modeMap.set(mode, data);
      total += amount;
    });

    const result: PaymentModeChart[] = [];
    modeMap.forEach((data, mode) => {
      result.push({
        mode,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }

  static async getLowStockMedicines(): Promise<TopMedicine[]> {
    const supabase = getSupabase();

    const { data } = await supabase
      .from('inv_products')
      .select(
        `id, name, reorder_level, 
         batches:inv_product_batches(quantity_on_hand)`
      )
      .eq('is_deleted', false)
      .gt('reorder_level', 0);

    if (!data) return [];

    return data
      .map((p: any) => {
        const totalQty = (p.batches || []).reduce((sum: number, b: any) => sum + (b.quantity_on_hand || 0), 0);
        return {
          productId: p.id,
          productName: p.name,
          quantitySold: totalQty,
          revenue: p.reorder_level
        };
      })
      .filter((m: TopMedicine) => m.quantitySold <= m.revenue)
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);
  }

  static async getExpiringMedicines(): Promise<TopMedicine[]> {
    const supabase = getSupabase();
    const soon = new Date(Date.now() + 7 * 86400000).toISOString();

    const { data } = await supabase
      .from('inv_product_batches')
      .select(
        `id, batch_number, quantity_on_hand, expiry_date,
         product:inv_products(id, name)`
      )
      .eq('is_deleted', false)
      .lt('expiry_date', soon)
      .order('expiry_date', { ascending: true })
      .limit(20);

    if (!data) return [];

    const medicineMap = new Map<string, { name: string; qty: number }>();
    data.forEach((b: any) => {
      const key = b.product?.id || 'unknown';
      if (!medicineMap.has(key)) {
        medicineMap.set(key, { name: b.product?.name || 'Unknown', qty: 0 });
      }
      const med = medicineMap.get(key)!;
      med.qty += b.quantity_on_hand || 0;
    });

    const result: TopMedicine[] = [];
    medicineMap.forEach((med, productId) => {
      result.push({
        productId,
        productName: med.name,
        quantitySold: med.qty,
        revenue: 0
      });
    });

    return result;
  }

  static async getPaymentPendingBills(limit: number = 10): Promise<RecentBill[]> {
    const supabase = getSupabase();

    const { data } = await supabase
      .from('ph_bills')
      .select(
        `id, bill_number, total_amount, paid_amount, status, created_at,
         patient:patients(name)`
      )
      .eq('is_deleted', false)
      .in('status', ['PENDING_PAYMENT', 'PARTIALLY_PAID'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((b: any) => ({
      billId: b.id,
      billNumber: b.bill_number,
      patientName: b.patient?.name || 'Walk-in',
      totalAmount: b.total_amount,
      paidAmount: b.paid_amount,
      status: b.status,
      createdAt: b.created_at
    }));
  }
}
