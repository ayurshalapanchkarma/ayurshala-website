import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0];

    // Get today's invoices
    const { data: todaysInvoices } = await supabase
      .from('bill_invoices')
      .select('total_amount, balance_amount, status')
      .gte('created_at', `${todayStr}T00:00:00`)
      .lt('created_at', `${tomorrowStr}T00:00:00`)
      .eq('is_deleted', false);

    // Calculate metrics
    const todaysRevenue = (todaysInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);
    const todaysCollections = (todaysInvoices || []).reduce((sum: number, inv: any) => sum + ((inv.total_amount || 0) - (inv.balance_amount || 0)), 0);
    const pendingAmount = (todaysInvoices || []).reduce((sum: number, inv: any) => sum + (inv.balance_amount || 0), 0);

    // Get recent invoices
    const { data: recentInvoices } = await supabase
      .from('bill_invoices')
      .select(
        `id, invoice_number, total_amount, balance_amount, status, created_at,
         patient:patients(name)`
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get outstanding invoices
    const { data: outstandingData } = await supabase
      .from('bill_invoices')
      .select(
        `patient_id, balance_amount,
         patient:patients(name)`
      )
      .eq('is_deleted', false)
      .gt('balance_amount', 0)
      .order('balance_amount', { ascending: false })
      .limit(10);

    // Get doctor revenue
    const { data: doctorRevenueData } = await supabase
      .from('bill_invoices')
      .select(
        `doctor_id, total_amount,
         doctor:users(name)`
      )
      .eq('is_deleted', false)
      .limit(100);

    // Process doctor data
    const doctorMap = new Map<string, { name: string; revenue: number; count: number }>();
    (doctorRevenueData || []).forEach((inv: any) => {
      if (!inv.doctor_id) return;
      if (!doctorMap.has(inv.doctor_id)) {
        doctorMap.set(inv.doctor_id, { name: inv.doctor?.name || 'Unknown', revenue: 0, count: 0 });
      }
      const doc = doctorMap.get(inv.doctor_id)!;
      doc.revenue += inv.total_amount || 0;
      doc.count += 1;
    });

    const doctorRevenue = Array.from(doctorMap.values()).map((doc, idx) => ({
      doctorId: `doc-${idx}`,
      doctorName: doc.name,
      revenue: doc.revenue,
      invoiceCount: doc.count
    }));

    // Process outstanding patients
    const patientMap = new Map<string, { name: string; outstanding: number; invoices: number }>();
    (outstandingData || []).forEach((inv: any) => {
      if (!inv.patient_id) return;
      if (!patientMap.has(inv.patient_id)) {
        patientMap.set(inv.patient_id, { name: inv.patient?.name || 'Unknown', outstanding: 0, invoices: 0 });
      }
      const pat = patientMap.get(inv.patient_id)!;
      pat.outstanding += inv.balance_amount || 0;
      pat.invoices += 1;
    });

    const outstandingPatients = Array.from(patientMap.entries()).map(([patientId, data]) => ({
      patientId,
      patientName: data.name,
      outstandingAmount: data.outstanding,
      invoiceCount: data.invoices
    }));

    const response = {
      todaysRevenue,
      todaysCollections,
      pendingAmount,
      refundsIssued: 0,
      invoicesCreated: (todaysInvoices || []).length,
      averageBillAmount: (todaysInvoices || []).length > 0 ? todaysRevenue / (todaysInvoices || []).length : 0,
      outstandingInvoices: outstandingPatients.length,
      paymentModeBreakdown: {},
      recentInvoices: (recentInvoices || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        patient_name: inv.patient?.name,
        total_amount: inv.total_amount,
        status: inv.status
      })),
      outstandingPatients,
      doctorRevenue
    };

    return NextResponse.json({ success: true, data: response }, { status: 200 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
