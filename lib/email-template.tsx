export function EmailLayout({
  title,
  subtitle,
  body,
  primaryAction,
  secondaryAction,
}: {
  title: string
  subtitle?: string
  body: string
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
}) {
  const buttons = []
  if (primaryAction) {
    buttons.push(`<a href="${primaryAction.href}" style="display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin-right:12px">${primaryAction.label}</a>`)
  }
  if (secondaryAction) {
    buttons.push(`<a href="${secondaryAction.href}" style="display:inline-block;padding:12px 28px;background:#f3f4f6;color:#374151;text-decoration:none;border-radius:6px;font-weight:600;border:1px solid #d1d5db">${secondaryAction.label}</a>`)
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-bottom:1px solid #e5e7eb">
    <tr><td style="padding:24px;text-align:center">
      <img src="https://ayurshala.com/ayurshala_text.png" alt="Ayurshala" height="48" style="max-height:48px;width:auto">
    </td></tr>
  </table>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f3">
    <tr><td style="padding:32px 24px;max-width:600px;margin:0 auto">
      <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:#ea580c;font-family:Georgia,serif">${title}</h1>
      ${subtitle ? `<p style="margin:0 0 24px 0;font-size:14px;color:#6b7280">${subtitle}</p>` : ''}
      <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:24px">${body}</div>
      ${buttons.length ? `<div style="text-align:center;margin-top:24px">${buttons.join(' ')}</div>` : ''}
    </td></tr>
  </table>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb">
    <tr><td style="padding:24px;text-align:center;font-size:12px;color:#6b7280">
      <p style="margin:0 0 8px 0">Ayurshala • Ayurvedic Healthcare</p>
    </td></tr>
  </table>
</body>
</html>`
}

export function BookingCard(booking: {
  bookingId: string
  patientName: string
  treatment: string
  date: string
  time: string
  amount: string
  status: string
}) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px">
    <tr><td style="padding:16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase">Booking Details</td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Booking ID</span><span style="color:#111827;font-weight:600;font-family:monospace">${booking.bookingId}</span></td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Patient</span><span style="color:#111827;font-weight:500">${booking.patientName}</span></td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Treatment</span><span style="color:#111827;font-weight:500">${booking.treatment}</span></td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Date</span><span style="color:#111827;font-weight:500">${booking.date}</span></td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Time</span><span style="color:#111827;font-weight:500">${booking.time}</span></td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Amount</span><span style="color:#111827;font-weight:600">${booking.amount}</span></td></tr>
    <tr><td style="padding:12px 16px;display:flex;justify-content:space-between;font-size:13px"><span style="color:#6b7280">Status</span><span style="color:#111827;font-weight:600">${booking.status}</span></td></tr>
  </table>`
}
