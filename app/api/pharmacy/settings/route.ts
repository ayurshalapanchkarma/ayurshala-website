import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('X-User-ID') || 'system';

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'pharmacy_settings')
      .single();

    const { data } = await supabase
      .from('system_settings')
      .upsert({
        key: 'pharmacy_settings',
        value: body,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .select()
      .single();

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'pharmacy_settings')
      .single();

    return NextResponse.json({ success: true, data: data?.value || {} }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: true, data: {} },
      { status: 200 }
    );
  }
}
