import { NextRequest, NextResponse } from 'next/server';
import { PharmacyInvoiceService } from '@/lib/inventory/pharmacy-invoice-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'pdf';
    const invoice = await PharmacyInvoiceService.getInvoiceData(params.billId);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (format === 'thermal') {
      const html = PharmacyInvoiceService.generateThermalHTML(invoice);
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (format === 'qr') {
      const qrCode = await PharmacyInvoiceService.generateQRCode(params.billId);
      return NextResponse.json({ success: true, data: qrCode }, { status: 200 });
    }

    // Default: PDF
    const html = PharmacyInvoiceService.generatePDFHTML(invoice);
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
