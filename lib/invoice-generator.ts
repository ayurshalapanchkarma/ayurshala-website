import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export async function generateInvoicePDF(booking: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  let yPosition = margin

  // Header
  doc.setFillColor(232, 98, 26)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('AYURSHALA', margin, yPosition + 15)

  yPosition += 30

  // Clinic Info
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Ayurshala Panchakarma Clinic', margin, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Clinic Address', margin, yPosition)
  yPosition += 4
  doc.text('Phone: +91-XXXXXXXXXX', margin, yPosition)
  yPosition += 8

  // Invoice Details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('INVOICE', margin, yPosition)
  yPosition += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Invoice #: INV-${booking.booking_id}`, margin, yPosition)
  yPosition += 4
  doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, margin, yPosition)
  yPosition += 4
  doc.text(`Booking ID: ${booking.booking_id}`, margin, yPosition)
  yPosition += 8

  // Patient Information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('PATIENT INFORMATION', margin, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Name: ${booking.patient_name}`, margin, yPosition)
  yPosition += 4
  doc.text(`Phone: ${booking.patient_phone}`, margin, yPosition)
  yPosition += 4
  doc.text(`Email: ${booking.patient_email}`, margin, yPosition)
  yPosition += 8

  // Appointment Information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('APPOINTMENT DETAILS', margin, yPosition)
  yPosition += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Doctor: ${booking.doctor_name || booking.doctor || 'Not Assigned'}`, margin, yPosition)
  yPosition += 4
  doc.text(`Treatment: ${booking.treatments}`, margin, yPosition)
  yPosition += 4
  doc.text(
    `Date & Time: ${new Date(booking.preferred_date).toLocaleDateString('en-IN')} ${booking.preferred_time}`,
    margin,
    yPosition
  )
  yPosition += 8

  // Charges Table
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('CHARGES', margin, yPosition)
  yPosition += 6

  // Table Header
  doc.setFillColor(232, 98, 26)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 6, 'F')
  doc.text('Description', margin + 2, yPosition + 1)
  doc.text('Amount', pageWidth - margin - 20, yPosition + 1)
  yPosition += 8

  // Table Rows
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const consultationCharge = booking.amount || 0
  doc.text('Consultation Charges', margin + 2, yPosition)
  doc.text(`₹${consultationCharge}`, pageWidth - margin - 20, yPosition)
  yPosition += 6

  // Total
  yPosition += 2
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('Grand Total', margin + 2, yPosition + 1)
  doc.text(`₹${consultationCharge}`, pageWidth - margin - 20, yPosition + 1)
  yPosition += 10

  // Payment Status
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Payment Status: ${booking.payment_status === 'PAID' ? 'PAID' : 'PENDING'}`, margin, yPosition)
  yPosition += 8

  // QR Code
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(booking.booking_id)
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 20, yPosition, 15, 15)
  } catch (error) {
    console.error('QR Code generation failed:', error)
  }

  yPosition += 20

  // Footer
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Thank you for choosing Ayurshala Panchakarma Clinic', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  })

  // Download
  doc.save(`Invoice-${booking.booking_id}.pdf`)
}
