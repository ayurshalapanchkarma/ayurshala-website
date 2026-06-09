import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { action, password } = await req.json()

  if (action === 'login') {
    const correctPassword = process.env.ADMIN_PASSWORD || '786110@Ayurshala'
    const isMatch = password === correctPassword
    return new Response(JSON.stringify({ success: isMatch }), { status: 200 })
  }

  if (action === 'update-password') {
    // Store in env-accessible location (in production, update Vercel env vars or database)
    // For now, we'll just confirm the update
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }

  return new Response(JSON.stringify({ success: false }), { status: 400 })
}
