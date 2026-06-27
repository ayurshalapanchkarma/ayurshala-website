import { PackageService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const pkg = await PackageService.createPackage(body as any)
    return successResponse(pkg, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const packages = await PackageService.getActivePackages()
    return successResponse(packages)
  } catch (error) {
    return handleApiError(error)
  }
}
