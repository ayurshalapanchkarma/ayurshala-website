import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  return createClient(supabaseUrl!, supabaseKey!);
}

export interface PatientMedicineHistory {
  patientId: string;
  patientName: string;
  phone: string;
  email: string;
  totalBills: number;
  totalSpent: number;
  lastBillDate: string;
  medicines: MedicinePurchase[];
}

export interface MedicinePurchase {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string;
  billNumber: string;
}

export interface PatientBalance {
  patientId: string;
  totalBillAmount: number;
  totalPaid: number;
  pendingAmount: number;
  lastTransactionDate: string;
}

export class PharmacyPatientService {
  static async getPatientMedicineHistory(patientId: string): Promise<PatientMedicineHistory | null> {
    const supabase = getSupabase();

    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, phone, email')
      .eq('id', patientId)
      .single();

    if (!patient) return null;

    const { data: bills } = await supabase
      .from('ph_bills')
      .select(
        `id, bill_number, total_amount, paid_amount, created_at,
         items:ph_bill_items(
           product_id, quantity, unit_price,
           product:inv_products(name)
         )`
      )
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (!bills) return null;

    const medicines: MedicinePurchase[] = [];
    let totalSpent = 0;

    bills.forEach((bill: any) => {
      (bill.items || []).forEach((item: any) => {
        medicines.push({
          medicineId: item.product_id,
          medicineName: item.product?.name || 'Unknown',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.unit_price * item.quantity,
          purchaseDate: bill.created_at,
          billNumber: bill.bill_number
        });
        totalSpent += item.unit_price * item.quantity;
      });
    });

    return {
      patientId: patient.id,
      patientName: patient.name,
      phone: patient.phone || '',
      email: patient.email || '',
      totalBills: bills.length,
      totalSpent,
      lastBillDate: bills.length > 0 ? bills[0].created_at : '',
      medicines
    };
  }

  static async getPatientBalance(patientId: string): Promise<PatientBalance | null> {
    const supabase = getSupabase();

    const { data: bills } = await supabase
      .from('ph_bills')
      .select('id, total_amount, paid_amount, created_at')
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (!bills) return null;

    let totalBillAmount = 0;
    let totalPaid = 0;

    bills.forEach((bill: any) => {
      totalBillAmount += bill.total_amount || 0;
      totalPaid += bill.paid_amount || 0;
    });

    return {
      patientId,
      totalBillAmount,
      totalPaid,
      pendingAmount: totalBillAmount - totalPaid,
      lastTransactionDate: bills.length > 0 ? bills[0].created_at : new Date().toISOString()
    };
  }

  static async getPatientBills(patientId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const supabase = getSupabase();

    const { data: bills } = await supabase
      .from('ph_bills')
      .select(
        `id, bill_number, total_amount, paid_amount, status, created_at`
      )
      .eq('patient_id', patientId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return bills || [];
  }

  static async searchPatients(query: string, limit: number = 10): Promise<any[]> {
    const supabase = getSupabase();

    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, phone, email')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_deleted', false)
      .limit(limit);

    return patients || [];
  }

  static async getPatientByPhone(phone: string): Promise<any | null> {
    const supabase = getSupabase();

    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, phone, email, date_of_birth')
      .eq('phone', phone)
      .eq('is_deleted', false)
      .single();

    return patient || null;
  }

  static async getPatientByEmail(email: string): Promise<any | null> {
    const supabase = getSupabase();

    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, phone, email, date_of_birth')
      .eq('email', email)
      .eq('is_deleted', false)
      .single();

    return patient || null;
  }

  static async getTopPatients(limit: number = 10): Promise<any[]> {
    const supabase = getSupabase();

    const { data: bills } = await supabase
      .from('ph_bills')
      .select(
        `patient_id, total_amount, paid_amount,
         patient:patients(id, name, phone)`
      )
      .eq('is_deleted', false)
      .limit(500);

    if (!bills) return [];

    const patientMap = new Map<string, { total: number; count: number; patient: any }>();

    bills.forEach((bill: any) => {
      if (!bill.patient_id || !bill.patient) return;

      const key = bill.patient_id;
      if (!patientMap.has(key)) {
        patientMap.set(key, { total: 0, count: 0, patient: bill.patient });
      }

      const data = patientMap.get(key)!;
      data.total += bill.total_amount || 0;
      data.count += 1;
    });

    const result = Array.from(patientMap.values()).map(data => ({
      ...data.patient,
      totalSpent: data.total,
      billsCount: data.count,
      averageBill: data.count > 0 ? data.total / data.count : 0
    }));

    return result.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
  }

  static async getRecentlyAddedPatients(limit: number = 10): Promise<any[]> {
    const supabase = getSupabase();

    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, phone, email, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    return patients || [];
  }
}
