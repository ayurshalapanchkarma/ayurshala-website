import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'ayurshalapanchkarma@gmail.com'

export async function POST(req: Request) {
  const { action, password } = await req.json()

  if (action === 'login') {
    // Only allow one admin email
    const correctPassword = process.env.ADMIN_PASSWORD || '786110@Ayurshala'
    const isMatch = password === correctPassword
    return new Response(JSON.stringify({ success: isMatch }), { status: 200 })
  }

  if (action === 'send-reset-link') {
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    // Store token in Supabase (if table exists)
    try {
      await supabase
        .from('admin_credentials')
        .update({ reset_token: token, reset_token_expires_at: expiresAt })
        .eq('email', ADMIN_EMAIL)
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Send email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: 'Ayurshala Admin - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E8621A;">Reset Your Admin Password</h2>
            <p>You requested a password reset for your Ayurshala Admin account.</p>
            <p style="margin: 30px 0;">
              <a href="https://ayurshalapanchakarma.com/admin/reset?token=${token}" 
                style="background-color: #E8621A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 12px;">
              This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      }),
    })

    const emailResult = await emailRes.json()
    console.log('Email sent:', emailResult)

    return new Response(JSON.stringify({ success: emailRes.ok }), { status: emailRes.ok ? 200 : 500 })
  }

  if (action === 'update-password') {
    // In production, this would update env vars or database
    // For now, just confirm
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }

  return new Response(JSON.stringify({ success: false }), { status: 400 })
}
