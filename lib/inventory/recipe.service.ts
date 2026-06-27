import { supabaseAdmin } from '@/lib/supabase-admin'
import { ValidationException } from './types'

export interface RecipeItem {
  productId: string
  quantityPerSession: number
  unitId: string
  isMandatory?: boolean
}

export interface CreateRecipeInput {
  treatmentName: string
  description?: string
  items: RecipeItem[]
}

export class RecipeService {
  /**
   * Create treatment recipe
   */
  static async createRecipe(input: CreateRecipeInput): Promise<any> {
    const errors: Array<{ field: string; message: string }> = []

    if (!input.treatmentName?.trim()) errors.push({ field: 'treatmentName', message: 'Treatment name required' })
    if (!input.items || input.items.length === 0) errors.push({ field: 'items', message: 'At least one item required' })

    if (errors.length > 0) throw new ValidationException(errors)

    // Create recipe
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('treatment_recipes')
      .insert({
        treatment_name: input.treatmentName.trim(),
        description: input.description || null,
      })
      .select()
      .single()

    if (recipeError) throw new Error(`Failed to create recipe: ${recipeError.message}`)

    // Add items
    const itemData = input.items.map((item) => ({
      recipe_id: recipe.id,
      product_id: item.productId,
      quantity_per_session: item.quantityPerSession,
      unit_id: item.unitId,
      is_mandatory: item.isMandatory !== false,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('treatment_recipe_items')
      .insert(itemData)

    if (itemsError) throw new Error(`Failed to add recipe items: ${itemsError.message}`)

    return this.getRecipe(recipe.id)
  }

  /**
   * Get recipe with items
   */
  static async getRecipe(recipeId: string): Promise<any> {
    const { data: recipe } = await supabaseAdmin
      .from('treatment_recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('is_deleted', false)
      .single()

    const { data: items } = await supabaseAdmin
      .from('treatment_recipe_items')
      .select('*, inventory_products(name, sku), inventory_units(name)')
      .eq('recipe_id', recipeId)
      .eq('is_deleted', false)

    return { ...recipe, items: items || [] }
  }

  /**
   * Get all recipes
   */
  static async getAllRecipes(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('treatment_recipes')
      .select('*')
      .eq('is_deleted', false)
      .order('treatment_name', { ascending: true })

    return data || []
  }

  /**
   * Get recipe by treatment name
   */
  static async getRecipeByName(treatmentName: string): Promise<any> {
    const { data: recipe } = await supabaseAdmin
      .from('treatment_recipes')
      .select('*')
      .eq('treatment_name', treatmentName)
      .eq('is_deleted', false)
      .single()

    if (!recipe) return null

    const { data: items } = await supabaseAdmin
      .from('treatment_recipe_items')
      .select('*, inventory_products(name, sku), inventory_units(name)')
      .eq('recipe_id', recipe.id)
      .eq('is_deleted', false)

    return { ...recipe, items: items || [] }
  }

  /**
   * Add item to recipe
   */
  static async addRecipeItem(recipeId: string, item: RecipeItem): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('treatment_recipe_items')
      .insert({
        recipe_id: recipeId,
        product_id: item.productId,
        quantity_per_session: item.quantityPerSession,
        unit_id: item.unitId,
        is_mandatory: item.isMandatory !== false,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to add recipe item: ${error.message}`)
    return data
  }

  /**
   * Update recipe item quantity
   */
  static async updateRecipeItem(recipeItemId: string, quantityPerSession: number): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('treatment_recipe_items')
      .update({ quantity_per_session: quantityPerSession })
      .eq('id', recipeItemId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update recipe item: ${error.message}`)
    return data
  }
}
