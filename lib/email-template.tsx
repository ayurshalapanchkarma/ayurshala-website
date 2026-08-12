const LOGO_URL = 'https://www.ayurshalapanchakarma.com/ayurshala_text.png'
const BRAND_COLOR = '#E8621A'
const FONT_STACK = 'Inter, Segoe UI, Helvetica Neue, Arial, sans-serif'

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
    buttons.push(`<a href="${primaryAction.href}" style="display:inline-block;padding:14px 32px;background:${BRAND_COLOR};color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin-right:12px;font-family:${FONT_STACK}">${primaryAction.label}</a>`)
  }
  if (secondaryAction) {
    buttons.push(`<a href="${secondaryAction.href}" style="display:inline-block;padding:14px 32px;background:#f3f4f6;color:#374151;text-decoration:none;border-radius:12px;font-weight:600;border:1px solid #d1d5db;font-family:${FONT_STACK}">${secondaryAction.label}</a>`)
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:${FONT_STACK};background:linear-gradient(135deg,#fdf6ee,#ffecd2,#fff8f0);margin:0;padding:20px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:transparent">
    <tr><td align="center" style="padding:20px 0">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,0.75) 0%,rgba(255,248,240,0.55) 50%,rgba(255,235,210,0.45) 100%);border:1px solid rgba(255,255,255,0.85);box-shadow:0 20px 80px rgba(232,98,26,0.12),0 4px 24px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1);backdrop-filter:blur(40px)">
        <tr><td style="background:linear-gradient(135deg,rgba(232,98,26,0.08) 0%,rgba(245,166,35,0.06) 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(232,98,26,0.15)">
          <img src="${LOGO_URL}" alt="Ayurshala" width="130" style="height:auto;display:block;margin:0 auto 16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.08))"/>
          <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:400;color:#1a1008;font-family:Georgia,serif;letter-spacing:0.5px">${title}</h1>
          ${subtitle ? `<p style="margin:0;font-size:14px;color:#78716c">${subtitle}</p>` : ''}
        </td></tr>
        <tr><td style="padding:40px">
          <div style="font-size:14px;color:#3f3f3f;line-height:1.8;margin-bottom:24px;font-family:${FONT_STACK}">${body}</div>
          ${buttons.length ? `<div style="text-align:center;margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${buttons.join('')}</div>` : ''}
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background:linear-gradient(135deg,rgba(255,248,240,0.4),rgba(245,166,35,0.04));border-top:1px solid rgba(232,98,26,0.08)">
          <p style="margin:0 0 8px 0;font-size:11px;color:#8b7c73;letter-spacing:0.3px;font-family:${FONT_STACK}">SP-28, Wajidpur, Sector-130, Noida — 201301</p>
          <p style="margin:0;font-size:10px;color:#a8a29e;font-family:${FONT_STACK}">© 2026 Ayurshala Panchakarma Center</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// EMAIL BUILDERS FOR ALL TEMPLATES
export function BookingConfirmationOnline(data: {
  patientName: string
  bookingId: string
  treatment: string
  date: string
  time: string
  amount: string
}) {
  const bookingDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;margin-bottom:24px;font-family:${FONT_STACK}">
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br>
        <span style="font-size:15px;color:#E8621A;font-weight:600">${data.bookingId}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br>
        <span style="font-size:15px;color:#1a1008">${data.treatment}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date & Time</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.date} · ${data.time}</span>
      </td></tr>
      <tr><td style="padding:12px 16px">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment</span><br>
        <span style="font-size:15px;color:#16a34a;font-weight:600">${data.amount}</span>
      </td></tr>
    </table>
  `
  const body = `${bookingDetailsHtml}<p style="font-family:${FONT_STACK};color:#3f3f3f;margin-top:24px">Your payment has been received successfully. Our team will call you shortly to confirm details about your appointment. Please arrive 10 minutes early.</p>`
  return EmailLayout({
    title: '✓ Booking Confirmed',
    subtitle: 'Your appointment is all set',
    body,
    primaryAction: { label: 'View My Bookings', href: 'https://www.ayurshalapanchakarma.com/my-bookings' },
    secondaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function BookingConfirmationCash(data: {
  patientName: string
  bookingId: string
  treatment: string
  date: string
  time: string
}) {
  const bookingDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;margin-bottom:24px;font-family:${FONT_STACK}">
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br>
        <span style="font-size:15px;color:#E8621A;font-weight:600">${data.bookingId}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br>
        <span style="font-size:15px;color:#1a1008">${data.treatment}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date & Time</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.date} · ${data.time}</span>
      </td></tr>
      <tr><td style="padding:12px 16px">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment</span><br>
        <span style="font-size:15px;color:#F97316;font-weight:600">Cash on Arrival</span>
      </td></tr>
    </table>
  `
  const body = `${bookingDetailsHtml}<p style="font-family:${FONT_STACK};color:#3f3f3f;margin-top:24px">Your booking is confirmed! Our team will call you shortly to confirm details. Payment is due at the clinic on the day of your appointment. Please arrive 10 minutes early.</p>`
  return EmailLayout({
    title: '✓ Booking Confirmed',
    subtitle: 'Payment due at clinic',
    body,
    primaryAction: { label: 'View My Bookings', href: 'https://www.ayurshalapanchakarma.com/my-bookings' },
    secondaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function PaymentSuccessful(data: {
  patientName: string
  bookingId: string
  amount: string
  date: string
  time: string
}) {
  const bookingDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(240,253,250,0.8),rgba(204,251,241,0.6));border-radius:18px;border:1px solid rgba(16,185,129,0.12);padding:24px;margin-bottom:24px;font-family:${FONT_STACK}">
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(16,185,129,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br>
        <span style="font-size:15px;color:#16a34a;font-weight:600">${data.bookingId}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(16,185,129,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Amount Paid</span><br>
        <span style="font-size:15px;color:#16a34a;font-weight:600">${data.amount}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(16,185,129,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Appointment Date</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.date} · ${data.time}</span>
      </td></tr>
      <tr><td style="padding:12px 16px">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Status</span><br>
        <span style="font-size:15px;color:#16a34a;font-weight:600">✓ Confirmed</span>
      </td></tr>
    </table>
  `
  const body = `${bookingDetailsHtml}<p style="font-family:${FONT_STACK};color:#3f3f3f;margin-top:24px">Your payment has been processed successfully and your appointment is confirmed. A reminder will be sent before your visit. Please arrive 10 minutes early.</p>`
  return EmailLayout({
    title: '✓ Payment Confirmed',
    subtitle: 'Your booking is confirmed',
    body,
    primaryAction: { label: 'View Booking', href: 'https://www.ayurshalapanchakarma.com/my-bookings' },
  })
}

export function PaymentFailed(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Your payment of <strong>${data.amount}</strong> could not be processed. Your booking has been cancelled.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">Please try again or contact our clinic for assistance.</p>`
  return EmailLayout({
    title: '✗ Payment Failed',
    subtitle: 'Your payment could not be processed',
    body,
    primaryAction: { label: 'Retry Payment', href: 'https://www.ayurshalapanchakarma.com/book' },
    secondaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function AppointmentCancelled(data: { patientName: string; bookingId: string; date: string; time: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Your appointment scheduled for <strong>${data.date} at ${data.time}</strong> has been cancelled.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">If you wish to book again or have questions, please contact us.</p>`
  return EmailLayout({
    title: '❌ Appointment Cancelled',
    subtitle: 'Your appointment was cancelled',
    body,
    primaryAction: { label: 'Book Again', href: 'https://www.ayurshalapanchakarma.com/book' },
    secondaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function RescheduleRequestReceived(data: { patientName: string; bookingId: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">We received your reschedule request for booking <strong>${data.bookingId}</strong>.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">Our team will review it and notify you within 24 hours. For urgent requests, please call us at +91-9821224767.</p>`
  return EmailLayout({
    title: '📅 Reschedule Request Received',
    subtitle: 'We will review your request',
    body,
    primaryAction: { label: 'View Booking', href: 'https://www.ayurshalapanchakarma.com/my-bookings' },
  })
}

export function RescheduleApproved(data: { patientName: string; bookingId: string; newDate: string; newTime: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Your reschedule request has been approved!</p><p style="font-family:${FONT_STACK};color:#3f3f3f;margin-bottom:16px;"><strong>Your new appointment:</strong><br><strong style="font-size:16px;color:#16a34a">${data.newDate} at ${data.newTime}</strong></p><p style="font-family:${FONT_STACK};color:#3f3f3f">Please arrive 10 minutes early. A reminder will be sent before your visit.</p>`
  return EmailLayout({
    title: '✓ Reschedule Approved',
    subtitle: 'Your new appointment is confirmed',
    body,
    primaryAction: { label: 'View Booking', href: 'https://www.ayurshalapanchakarma.com/my-bookings' },
  })
}

export function RescheduleRejected(data: { patientName: string; bookingId: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Unfortunately, your reschedule request for booking <strong>${data.bookingId}</strong> could not be approved.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">Your original appointment remains active. Please contact us to discuss alternatives.</p>`
  return EmailLayout({
    title: '⚠️ Reschedule Not Available',
    subtitle: 'Request could not be approved',
    body,
    primaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function RefundInitiated(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Your refund of <strong>${data.amount}</strong> has been initiated for booking <strong>${data.bookingId}</strong>.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">The amount will be credited to your original payment method within 3-5 business days.</p>`
  return EmailLayout({
    title: '💰 Refund Initiated',
    subtitle: 'Your refund is being processed',
    body,
  })
}

export function RefundCompleted(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f">Your refund of <strong>${data.amount}</strong> for booking <strong>${data.bookingId}</strong> has been completed successfully.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">The amount has been credited to your bank account. Please allow 1-2 business days for it to reflect.</p>`
  return EmailLayout({
    title: '✓ Refund Completed',
    subtitle: 'Your refund has been processed',
    body,
  })
}

// ADMIN EMAIL BUILDERS
export function AdminNewOnlineBooking(data: { patientName: string; bookingId: string; treatment: string; date: string; time: string; amount: string }) {
  const bookingDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;margin-bottom:24px;font-family:${FONT_STACK}">
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.patientName}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br>
        <span style="font-size:15px;color:#E8621A;font-weight:600">${data.bookingId}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br>
        <span style="font-size:15px;color:#1a1008">${data.treatment}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date & Time</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.date} · ${data.time}</span>
      </td></tr>
      <tr><td style="padding:12px 16px">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment Status</span><br>
        <span style="font-size:15px;color:#16a34a;font-weight:600">✓ Online Paid — ${data.amount}</span>
      </td></tr>
    </table>
  `
  const body = `${bookingDetailsHtml}<p style="font-family:${FONT_STACK};color:#3f3f3f">A new online booking with confirmed payment has been received. Please send a confirmation message to the patient if needed.</p>`
  return EmailLayout({
    title: '📋 New Online Booking',
    subtitle: 'Payment confirmed',
    body,
    primaryAction: { label: 'View Admin Panel', href: 'https://www.ayurshalapanchakarma.com/admin' },
  })
}

export function AdminNewOfflineBooking(data: { patientName: string; bookingId: string; treatment: string; date: string; time: string }) {
  const bookingDetailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(255,248,240,0.8),rgba(255,240,225,0.6));border-radius:18px;border:1px solid rgba(232,98,26,0.12);padding:24px;margin-bottom:24px;font-family:${FONT_STACK}">
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Patient</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.patientName}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Booking ID</span><br>
        <span style="font-size:15px;color:#E8621A;font-weight:600">${data.bookingId}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Treatment</span><br>
        <span style="font-size:15px;color:#1a1008">${data.treatment}</span>
      </td></tr>
      <tr><td style="padding:12px 16px;border-bottom:1px solid rgba(232,98,26,0.08)">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Date & Time</span><br>
        <span style="font-size:15px;color:#1a1008;font-weight:600">${data.date} · ${data.time}</span>
      </td></tr>
      <tr><td style="padding:12px 16px">
        <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#a8a29e;font-weight:600">Payment Status</span><br>
        <span style="font-size:15px;color:#F97316;font-weight:600">💵 Cash on Arrival</span>
      </td></tr>
    </table>
  `
  const body = `${bookingDetailsHtml}<p style="font-family:${FONT_STACK};color:#3f3f3f">A new cash-on-arrival booking has been received. Please confirm and call the patient to collect payment details or confirm the appointment.</p>`
  return EmailLayout({
    title: '📋 New Cash-on-Arrival Booking',
    subtitle: 'Awaiting confirmation',
    body,
    primaryAction: { label: 'View Admin Panel', href: 'https://www.ayurshalapanchakarma.com/admin' },
  })
}

export function AdminCancellationAlert(data: { patientName: string; bookingId: string; wasOnline: boolean; refundAmount?: string }) {
  const body = data.wasOnline
    ? `<p style="font-family:${FONT_STACK};color:#3f3f3f"><strong>${data.patientName}</strong> cancelled their online booking <strong>${data.bookingId}</strong>.</p><p style="font-family:${FONT_STACK};color:#d32f2f;font-weight:600">⚠️ Refund Required: ₹${data.refundAmount}</p><p style="font-family:${FONT_STACK};color:#3f3f3f">Please process the refund to the patient's original payment method.</p>`
    : `<p style="font-family:${FONT_STACK};color:#3f3f3f"><strong>${data.patientName}</strong> cancelled their cash-on-arrival booking <strong>${data.bookingId}</strong>.</p><p style="font-family:${FONT_STACK};color:#3f3f3f">No refund needed.</p>`
  return EmailLayout({
    title: '❌ Booking Cancelled',
    subtitle: data.wasOnline ? 'Refund pending' : 'No refund needed',
    body,
    primaryAction: { label: 'View Admin Panel', href: 'https://www.ayurshalapanchakarma.com/admin' },
  })
}

export function AdminRescheduleRequest(data: { patientName: string; bookingId: string; oldDate: string; newDate: string }) {
  const body = `<p style="font-family:${FONT_STACK};color:#3f3f3f"><strong>${data.patientName}</strong> requested to reschedule booking <strong>${data.bookingId}</strong>.</p><p style="font-family:${FONT_STACK};color:#3f3f3f"><strong>Current:</strong> ${data.oldDate}<br><strong>Requested:</strong> ${data.newDate}</p><p style="font-family:${FONT_STACK};color:#3f3f3f">Please review and approve or decline the request.</p>`
  return EmailLayout({
    title: '🔄 Reschedule Request',
    subtitle: 'Awaiting your approval',
    body,
    primaryAction: { label: 'View Admin Panel', href: 'https://www.ayurshalapanchakarma.com/admin' },
  })
}
