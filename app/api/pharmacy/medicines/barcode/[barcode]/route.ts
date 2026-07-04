import { NextRequest, NextResponse } from 'next/server'
import { PharmacyMedicineService } from '@/lib/inventory/pharmacy-medicine-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const medicine = await PharmacyMedicineService.getMedicineByBarcode(params.barcode)

    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(medicine)
  } catch (error: any) {
    console.error('GET /api/pharmacy/medicines/barcode/[barcode] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medicine' },
      { status: 500 }
    )
  }
}
