import { NextRequest, NextResponse } from 'next/server'
import { PharmacyMedicineService } from '@/lib/inventory/pharmacy-medicine-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || ''
    const searchType = (searchParams.get('type') || 'name') as 'name' | 'generic' | 'barcode' | 'batch'
    const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true'

    const medicines = await PharmacyMedicineService.searchMedicines({
      search,
      searchType,
      includeOutOfStock,
    })

    return NextResponse.json(medicines)
  } catch (error: any) {
    console.error('GET /api/pharmacy/medicines/search error:', error)
    return NextResponse.json(
      { error: 'Failed to search medicines' },
      { status: 500 }
    )
  }
}
