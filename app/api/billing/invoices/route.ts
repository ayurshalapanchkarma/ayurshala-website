import { NextRequest, NextResponse } from 'next/server';
import { HospitalBillingService, CreateInvoiceInput } from '@/lib/inventory/hospital-billing-service';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    const status = request.nextUrl.searchParams.get('status');
    const patientId = request.nextUrl.searchParams.get('patientId');

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('bill_invoices')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (patientId) query = query.eq('patient_id', patientId);

    const { data } = await query;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Invoices error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const input: CreateInvoiceInput = {
      patient_id: body.patientId,
      doctor_id: body.doctorId,
      appointment_id: body.appointmentId,
      items: body.items || [],
      discount_amount: body.discountAmount || 0,
      discount_type: body.discountType || 'FLAT',
      notes: body.notes
    };

    const invoice = await HospitalBillingService.createInvoice(input, userId);

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
