import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { PrescriptionService } from '@/lib/emr/diagnosis-prescription.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    });

    const prescriptionService = new PrescriptionService(client);
    const prescription = await prescriptionService.getPrescription(params.visitId);

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('GET /api/emr/visits/[visitId]/prescription', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prescription',
      },
      { status: 400 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const prescriptionService = new PrescriptionService(client);
    const prescription = await prescriptionService.createPrescription(
      params.visitId,
      profile.id,
      body
    );

    return NextResponse.json(
      {
        success: true,
        data: prescription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/emr/visits/[visitId]/prescription', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create prescription',
      },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const prescriptionService = new PrescriptionService(client);
    const prescription = await prescriptionService.updatePrescription(
      params.visitId,
      profile.id,
      body
    );

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error('PUT /api/emr/visits/[visitId]/prescription', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prescription',
      },
      { status: 400 }
    );
  }
}
