import { RecipeService } from '@/lib/inventory'
import { handleApiError, successResponse, parseBody } from '@/lib/inventory/api-helper'

export async function POST(request: Request) {
  try {
    const body = await parseBody(request)
    const recipe = await RecipeService.createRecipe(body as any)
    return successResponse(recipe, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const recipes = await RecipeService.getAllRecipes()
    return successResponse(recipes)
  } catch (error) {
    return handleApiError(error)
  }
}
