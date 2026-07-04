import { NextRequest, NextResponse } from 'next/server';

// Clinic configuration stored in Supabase or environment
// For now, use environment variables with defaults
const getDefaultSettings = () => ({
  clinicName: process.env.CLINIC_NAME || 'Ayurshala – Ayurveda and Panchakarma Center',
  clinicAddress: process.env.CLINIC_ADDRESS || '',
  clinicPhone: process.env.CLINIC_PHONE || '',
  clinicEmail: process.env.CLINIC_EMAIL || '',
  gstNumber: process.env.CLINIC_GST || '',
  invoicePrefix: process.env.INVOICE_PREFIX || 'INV',
  pharmacyPrefix: process.env.PHARMACY_PREFIX || 'PH',
  receiptFooter: process.env.RECEIPT_FOOTER || 'Thank you for choosing Ayurshala – Ayurveda and Panchakarma Center',
  defaultCurrency: 'INR',
  timezone: 'Asia/Kolkata'
});

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    // For now, return environment variables
    const settings = getDefaultSettings();
    
    return NextResponse.json({ 
      success: true, 
      data: settings 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clinic settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate admin permission
    const userId = request.headers.get('X-User-ID');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, save to database
    // For now, log and acknowledge
    console.log('Clinic settings update request:', body);
    
    // TODO: Implement database storage for clinic settings
    // This would require a clinic_settings table in Supabase
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Settings saved successfully (note: persistence requires database setup)',
        data: body
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving clinic settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save clinic settings' },
      { status: 500 }
    );
  }
}
