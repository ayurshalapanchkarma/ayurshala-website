import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { action, password } = await req.json()

  if (action === 'login') {
    // Try to get stored password from admin_credentials table
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('password_hash')
      .eq('email', 'ayurshalapanchkarma@gmail.com')
      .single()

    console.log('Fetched admin record:', { error, data })

    // Fallback to hardcoded password if table doesn't exist or no record
    const correctPassword = data?.password_hash || process.env.ADMIN_PASSWORD || '786110@Ayurshala'
    
    // If stored as hash, compare; otherwise direct comparison
    const isMatch = correctPassword.startsWith('$2') 
      ? false // Can't compare bcrypt hashes without bcrypt lib working
      : password === correctPassword

    console.log('Login attempt:', { correctPassword: correctPassword.slice(0, 10) + '...', passwordMatch: isMatch })

    return new Response(JSON.stringify({ success: isMatch }), { status: 200 })
  }

  if (action === 'reset-request') {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000)

    await supabase
      .from('admin_credentials')
      .update({ reset_token: token, reset_token_expires_at: expiresAt })
      .eq('email', 'ayurshalapanchkarma@gmail.com')

    // Send email
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: 'ayurshalapanchkarma@gmail.com',
        subject: 'Admin Password Reset',
        html: `<p>Click to reset: <a href="https://ayurshalapanchakarma.com/admin/reset?token=${token}">Reset</a></p><p>Expires in 1 hour</p>`,
      }),
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }

  if (action === 'reset-password') {
    const { token, newPassword } = await req.json()

    const { data } = await supabase
      .from('admin_credentials')
      .select('reset_token_expires_at')
      .eq('reset_token', token)
      .single()

    if (!data || new Date() > new Date(data.reset_token_expires_at)) {
      return new Response(JSON.stringify({ success: false, msg: 'Invalid or expired token' }), { status: 400 })
    }

    await supabase
      .from('admin_credentials')
      .update({ password_hash: newPassword, reset_token: null, reset_token_expires_at: null })
      .eq('reset_token', token)

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }

  return new Response(JSON.stringify({ success: false }), { status: 400 })
}
