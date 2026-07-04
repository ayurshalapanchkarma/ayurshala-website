import { NextRequest, NextResponse } from 'next/server'
import { PharmacyMedicineService } from '@/lib/inventory/pharmacy-medicine-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medicine = await PharmacyMedicineService.getMedicineById(params.id)
    return NextResponse.json(medicine)
  } catch (error: any) {
    console.error('GET /api/pharmacy/medicines/[id] error:', error)
    return NextResponse.json(
      { error: 'Medicine not found' },
      { status: 404 }
    )
  }
}
