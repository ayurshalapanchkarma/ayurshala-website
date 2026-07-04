import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const reportType = request.nextUrl.searchParams.get('type') || 'revenue';
    const fromDate = request.nextUrl.searchParams.get('fromDate');
    const toDate = request.nextUrl.searchParams.get('toDate');

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let data: any = [];

    switch (reportType) {
      case 'revenue': {
        const { data: invoices } = await supabase
          .from('bill_invoices')
          .select('*, patient:patients(name)')
          .gte('created_at', `${fromDate || '2000-01-01'}T00:00:00`)
          .lte('created_at', `${toDate || '2099-12-31'}T23:59:59`)
          .eq('is_deleted', false);

        data = (invoices || []).map((inv: any) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          patientName: inv.patient?.name || 'Unknown',
          totalAmount: inv.total_amount,
          paidAmount: inv.paid_amount,
          status: inv.status,
          date: inv.created_at
        }));
        break;
      }

      case 'collections': {
        const { data: payments } = await supabase
          .from('bill_payments')
          .select('*')
          .gte('created_at', `${fromDate || '2000-01-01'}T00:00:00`)
          .lte('created_at', `${toDate || '2099-12-31'}T23:59:59`);

        const modeMap = new Map<string, { count: number; total: number }>();
        (payments || []).forEach((p: any) => {
          const mode = p.payment_mode || 'CASH';
          if (!modeMap.has(mode)) {
            modeMap.set(mode, { count: 0, total: 0 });
          }
          const m = modeMap.get(mode)!;
          m.count += 1;
          m.total += p.amount || 0;
        });

        data = Array.from(modeMap.entries()).map(([mode, m]) => ({
          paymentMode: mode,
          count: m.count,
          totalAmount: m.total,
          averageAmount: m.total / m.count
        }));
        break;
      }

      case 'outstanding': {
        const { data: invoices } = await supabase
          .from('bill_invoices')
          .select('*, patient:patients(name)')
          .gt('balance_amount', 0)
          .eq('is_deleted', false);

        data = (invoices || []).map((inv: any) => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          patientName: inv.patient?.name || 'Unknown',
          totalAmount: inv.total_amount,
          outstandingAmount: inv.balance_amount,
          daysOverdue: Math.floor((Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }));
        break;
      }

      case 'refunds': {
        const { data: refunds } = await supabase
          .from('bill_refunds')
          .select('*')
          .eq('is_deleted', false)
          .gte('created_at', `${fromDate || '2000-01-01'}T00:00:00`)
          .lte('created_at', `${toDate || '2099-12-31'}T23:59:59`);

        data = (refunds || []).map((r: any) => ({
          refundId: r.id,
          invoiceId: r.invoice_id,
          refundAmount: r.refund_amount,
          reason: r.reason,
          status: r.status,
          date: r.created_at
        }));
        break;
      }

      case 'packages': {
        const { data: packages } = await supabase
          .from('bill_package_usage')
          .select('*, package:bill_packages(name, total_sessions)')
          .eq('is_deleted', false);

        data = (packages || []).map((p: any) => ({
          packageId: p.package?.id,
          packageName: p.package?.name,
          totalSessions: p.package?.total_sessions,
          usedSessions: p.used_sessions || 0,
          remainingSessions: (p.package?.total_sessions || 0) - (p.used_sessions || 0)
        }));
        break;
      }

      default:
        data = [];
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
