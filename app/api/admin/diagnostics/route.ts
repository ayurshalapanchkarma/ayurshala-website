import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    site_url: process.env.NEXT_PUBLIC_SITE_URL,
  })
}
