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
// EMAIL BUILDERS FOR ALL 13 TEMPLATES
export function BookingConfirmationOnline(data: {
  patientName: string
  bookingId: string
  treatment: string
  date: string
  time: string
  amount: string
}) {
  const body = `<p>Your online booking is confirmed! A payment receipt has been sent to your registered email.</p><p>Please arrive 5-10 minutes early for your appointment.</p>`
  return EmailLayout({
    title: 'Booking Confirmed',
    subtitle: 'Your appointment is all set',
    body,
    primaryAction: { label: 'View My Bookings', href: 'https://ayurshala.com/my-bookings' },
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
  const body = `<p>Your booking is confirmed! Payment is due at the clinic on the day of appointment.</p><p>Please arrive 5-10 minutes early.</p>`
  return EmailLayout({
    title: 'Booking Confirmed',
    subtitle: 'Your appointment is all set',
    body,
    primaryAction: { label: 'View My Bookings', href: 'https://ayurshala.com/my-bookings' },
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
  const body = `<p>Your payment of <strong>${data.amount}</strong> has been received successfully.</p><p>Your appointment is confirmed for <strong>${data.date} at ${data.time}</strong>.</p>`
  return EmailLayout({
    title: 'Payment Confirmed',
    subtitle: 'Your booking is confirmed',
    body,
    primaryAction: { label: 'View Booking', href: 'https://ayurshala.com/my-bookings' },
  })
}

export function PaymentFailed(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p>Your payment of <strong>${data.amount}</strong> could not be processed.</p><p>Your booking has been cancelled. Please try again or contact our clinic.</p>`
  return EmailLayout({
    title: 'Payment Failed',
    subtitle: 'Your payment could not be processed',
    body,
    primaryAction: { label: 'Try Again', href: 'https://ayurshala.com/book' },
    secondaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function AppointmentCancelled(data: { patientName: string; bookingId: string; date: string; time: string }) {
  const body = `<p>Your appointment scheduled for <strong>${data.date} at ${data.time}</strong> has been cancelled.</p><p>If you need to reschedule, please contact our clinic.</p>`
  return EmailLayout({
    title: 'Appointment Cancelled',
    subtitle: 'Your appointment was cancelled',
    body,
    primaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
    secondaryAction: { label: 'Book Again', href: 'https://ayurshala.com/book' },
  })
}

export function RescheduleRequestReceived(data: { patientName: string; bookingId: string }) {
  const body = `<p>We received your reschedule request.</p><p>Our team will review it and notify you within 24 hours.</p>`
  return EmailLayout({
    title: 'Reschedule Request Received',
    subtitle: 'We will review your request',
    body,
    primaryAction: { label: 'View Booking', href: 'https://ayurshala.com/my-bookings' },
  })
}

export function RescheduleApproved(data: { patientName: string; bookingId: string; newDate: string; newTime: string }) {
  const body = `<p>Your reschedule request has been approved!</p><p>Your new appointment is <strong>${data.newDate} at ${data.newTime}</strong>.</p>`
  return EmailLayout({
    title: 'Reschedule Approved',
    subtitle: 'Your new appointment is confirmed',
    body,
    primaryAction: { label: 'View Booking', href: 'https://ayurshala.com/my-bookings' },
  })
}

export function RescheduleRejected(data: { patientName: string; bookingId: string }) {
  const body = `<p>Unfortunately, your reschedule request could not be approved.</p><p>Your original appointment remains active. Contact us to discuss alternatives.</p>`
  return EmailLayout({
    title: 'Reschedule Unavailable',
    subtitle: 'Request could not be approved',
    body,
    primaryAction: { label: 'Contact Clinic', href: 'tel:+919821224767' },
  })
}

export function RefundInitiated(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p>Your refund of <strong>${data.amount}</strong> has been initiated.</p><p>The amount will be credited to your original payment method within 3-5 business days.</p>`
  return EmailLayout({
    title: 'Refund Initiated',
    subtitle: 'Your refund is being processed',
    body,
  })
}

export function RefundCompleted(data: { patientName: string; bookingId: string; amount: string }) {
  const body = `<p>Your refund of <strong>${data.amount}</strong> has been completed successfully.</p><p>Check your bank account for the credit.</p>`
  return EmailLayout({
    title: 'Refund Completed',
    subtitle: 'Your refund has been processed',
    body,
  })
}

// ADMIN EMAIL BUILDERS
export function AdminNewOnlineBooking(data: { patientName: string; bookingId: string; treatment: string; date: string; time: string; amount: string }) {
  const body = `<p><strong>${data.patientName}</strong> has booked an online appointment.</p><p>Payment received: <strong>${data.amount}</strong></p><p><strong>When:</strong> ${data.date} at ${data.time}</p><p><strong>Treatment:</strong> ${data.treatment}</p>`
  return EmailLayout({
    title: 'New Online Booking',
    subtitle: 'Payment confirmed',
    body,
    primaryAction: { label: 'View Dashboard', href: 'https://ayurshala.com/admin' },
  })
}

export function AdminNewOfflineBooking(data: { patientName: string; bookingId: string; treatment: string; date: string; time: string }) {
  const body = `<p><strong>${data.patientName}</strong> has booked a cash-on-arrival appointment.</p><p><strong>When:</strong> ${data.date} at ${data.time}</p><p><strong>Treatment:</strong> ${data.treatment}</p><p>Payment will be collected at the clinic.</p>`
  return EmailLayout({
    title: 'New Offline Booking',
    subtitle: 'Awaiting confirmation',
    body,
    primaryAction: { label: 'View Dashboard', href: 'https://ayurshala.com/admin' },
  })
}

export function AdminCancellationAlert(data: { patientName: string; bookingId: string; wasOnline: boolean; refundAmount?: string }) {
  const body = data.wasOnline
    ? `<p><strong>${data.patientName}</strong> cancelled their online booking.</p><p><strong>Refund Required:</strong> ₹${data.refundAmount}</p>`
    : `<p><strong>${data.patientName}</strong> cancelled their cash-on-arrival booking.</p><p>No refund needed.</p>`
  return EmailLayout({
    title: 'Booking Cancelled',
    subtitle: data.wasOnline ? 'Refund pending' : 'No refund',
    body,
    primaryAction: { label: 'View Dashboard', href: 'https://ayurshala.com/admin' },
  })
}

export function AdminRescheduleRequest(data: { patientName: string; bookingId: string; oldDate: string; newDate: string }) {
  const body = `<p><strong>${data.patientName}</strong> requested to reschedule their appointment.</p><p><strong>Current:</strong> ${data.oldDate}</p><p><strong>Requested:</strong> ${data.newDate}</p>`
  return EmailLayout({
    title: 'Reschedule Request',
    subtitle: 'Awaiting your approval',
    body,
    primaryAction: { label: 'View Dashboard', href: 'https://ayurshala.com/admin' },
  })
}
