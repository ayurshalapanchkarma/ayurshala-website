/**
 * Enhanced Category Service for Phase 3
 * Complete CRUD operations with validation and error handling
 */

import { createClient } from '@supabase/supabase-js'
import { InventoryValidators, ValidationResult } from './validators'

interface Category {
  uuid: string
  name: string
  description?: string
  display_order: number
  color?: string
  icon?: string
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface CreateCategoryInput {
  name: string
  description?: string
  display_order?: number
  color?: string
  icon?: string
}

interface UpdateCategoryInput {
  name?: string
  description?: string
  display_order?: number
  color?: string
  icon?: string
  is_active?: boolean
}

interface ListOptions {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'created_at' | 'display_order'
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
}

interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class CategoryService {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  /**
   * Get all categories with pagination, search, and filtering
   */
  static async getCategories(
    options: ListOptions = {}
  ): Promise<ListResponse<Category>> {
    const {
      search = '',
      page = 1,
      pageSize = 10,
      sortBy = 'display_order',
      sortOrder = 'asc',
      includeDeleted = false,
    } = options

    try {
      let query = this.supabase
        .from('inv_categories')
        .select('*', { count: 'exact' })

      // Add soft delete filter
      if (!includeDeleted) {
        query = query.eq('is_deleted', false)
      }

      // Add search filter
      if (search.trim()) {
        query = query.ilike('name', `%${search}%`)
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Add pagination
      const from = (page - 1) * pageSize
      query = query.range(from, from + pageSize - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data as Category[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories')
    }
  }

  /**
   * Get a single category by ID
   */
  static async getCategoryById(id: string): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from('inv_categories')
        .select('*')
        .eq('uuid', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Category not found')

      return data as Category
    } catch (error) {
      console.error('Error fetching category:', error)
      throw new Error('Failed to fetch category')
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    input: CreateCategoryInput,
    userId?: string
  ): Promise<Category> {
    // Validate input
    const validation = InventoryValidators.validateCategory(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      // Check for duplicate name
      const { data: existing } = await this.supabase
        .from('inv_categories')
        .select('uuid')
        .eq('name', input.name)
        .eq('is_deleted', false)
        .single()

      if (existing) {
        throw new ValidationError({ name: 'Category name already exists' })
      }

      const { data, error } = await this.supabase
        .from('inv_categories')
        .insert([
          {
            name: input.name.trim(),
            description: input.description?.trim() || null,
            display_order: input.display_order || 0,
            color: input.color || null,
            icon: input.icon || null,
            is_active: true,
            is_deleted: false,
            created_by: userId || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data as Category
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error creating category:', error)
      throw new Error('Failed to create category')
    }
  }

  /**
   * Update a category
   */
  static async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    userId?: string
  ): Promise<Category> {
    // Validate that category exists
    const existing = await this.getCategoryById(id)
    if (existing.is_deleted) {
      throw new Error('Cannot update deleted category')
    }

    // Validate input
    const validation = InventoryValidators.validateCategory(input)
    if (!validation.valid) {
      throw new ValidationError(validation.errors)
    }

    try {
      // Check for duplicate name if name is being changed
      if (input.name && input.name !== existing.name) {
        const { data: duplicate } = await this.supabase
          .from('inv_categories')
          .select('uuid')
          .eq('name', input.name)
          .eq('is_deleted', false)
          .neq('uuid', id)
          .single()

        if (duplicate) {
          throw new ValidationError({ name: 'Category name already exists' })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }

      if (input.name !== undefined)
        updateData.name = input.name.trim()
      if (input.description !== undefined)
        updateData.description = input.description?.trim() || null
      if (input.display_order !== undefined)
        updateData.display_order = input.display_order
      if (input.color !== undefined) updateData.color = input.color || null
      if (input.icon !== undefined) updateData.icon = input.icon || null
      if (input.is_active !== undefined)
        updateData.is_active = input.is_active

      const { data, error } = await this.supabase
        .from('inv_categories')
        .update(updateData)
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Category
    } catch (error) {
      if (error instanceof ValidationError) throw error
      console.error('Error updating category:', error)
      throw new Error('Failed to update category')
    }
  }

  /**
   * Soft delete a category
   */
  static async deleteCategory(id: string, userId?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('inv_categories')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting category:', error)
      throw new Error('Failed to delete category')
    }
  }

  /**
   * Restore a soft-deleted category
   */
  static async restoreCategory(id: string, userId?: string): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from('inv_categories')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Category
    } catch (error) {
      console.error('Error restoring category:', error)
      throw new Error('Failed to restore category')
    }
  }

  /**
   * Toggle category active status
   */
  static async toggleCategoryStatus(
    id: string,
    userId?: string
  ): Promise<Category> {
    try {
      const existing = await this.getCategoryById(id)

      const { data, error } = await this.supabase
        .from('inv_categories')
        .update({
          is_active: !existing.is_active,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq('uuid', id)
        .select()
        .single()

      if (error) throw error

      return data as Category
    } catch (error) {
      console.error('Error toggling category status:', error)
      throw new Error('Failed to toggle category status')
    }
  }
}

export class ValidationError extends Error {
  constructor(public errors: Record<string, string>) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}
