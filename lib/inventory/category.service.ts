/**
 * Category Service
 * Handles all category operations with validation and business logic
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  InventoryCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  ValidationException,
} from './types'

export class CategoryService {
  /**
   * Get all active categories
   */
  static async getCategories(includeDeleted = false): Promise<InventoryCategory[]> {
    let query = supabaseAdmin
      .from('inventory_categories')
      .select('*')
      .order('sort_order')

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    const { data, error } = await query

    if (error) throw new Error(`Failed to fetch categories: ${error.message}`)
    return data || []
  }

  /**
   * Get single category by ID
   */
  static async getCategoryById(id: string): Promise<InventoryCategory> {
    const { data, error } = await supabaseAdmin
      .from('inventory_categories')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Category not found: ${error.message}`)
    if (!data) throw new Error('Category not found')
    return data
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<InventoryCategory> {
    const { data, error } = await supabaseAdmin
      .from('inventory_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .single()

    if (error) throw new Error(`Category not found: ${error.message}`)
    if (!data) throw new Error('Category not found')
    return data
  }

  /**
   * Create a new category
   */
  static async createCategory(input: CreateCategoryInput): Promise<InventoryCategory> {
    // Validation
    if (!input.name?.trim()) {
      throw new ValidationException([{ field: 'name', message: 'Category name is required' }])
    }

    const slug = input.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    if (!slug) {
      throw new ValidationException([{ field: 'name', message: 'Category name must contain valid characters' }])
    }

    // Check for duplicate slug
    const { data: existingCategory } = await supabaseAdmin
      .from('inventory_categories')
      .select('id')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .single()

    if (existingCategory) {
      throw new ValidationException([{ field: 'name', message: 'Category with this name already exists' }])
    }

    // Create category
    const { data, error } = await supabaseAdmin
      .from('inventory_categories')
      .insert({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        icon: input.icon || null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create category: ${error.message}`)
    if (!data) throw new Error('Failed to create category')
    return data
  }

  /**
   * Update category
   */
  static async updateCategory(id: string, input: UpdateCategoryInput): Promise<InventoryCategory> {
    // Verify category exists
    await this.getCategoryById(id)

    // Build update object - only include provided fields
    const updateData: Record<string, any> = {}

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ValidationException([{ field: 'name', message: 'Category name cannot be empty' }])
      }
      updateData.name = input.name.trim()
      updateData.slug = input.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null
    }

    if (input.icon !== undefined) {
      updateData.icon = input.icon || null
    }

    if (input.sort_order !== undefined) {
      updateData.sort_order = input.sort_order
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active
    }

    // Update category
    const { data, error } = await supabaseAdmin
      .from('inventory_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update category: ${error.message}`)
    if (!data) throw new Error('Failed to update category')
    return data
  }

  /**
   * Soft delete category
   */
  static async deleteCategory(id: string): Promise<void> {
    // Verify category exists
    await this.getCategoryById(id)

    const { error } = await supabaseAdmin
      .from('inventory_categories')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete category: ${error.message}`)
  }

  /**
   * Restore deleted category
   */
  static async restoreCategory(id: string): Promise<InventoryCategory> {
    const { data, error } = await supabaseAdmin
      .from('inventory_categories')
      .update({ is_deleted: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to restore category: ${error.message}`)
    if (!data) throw new Error('Failed to restore category')
    return data
  }
}
