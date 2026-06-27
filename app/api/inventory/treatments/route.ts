import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('treatment_recipes')
    .select('*, treatment_recipe_items(*, inventory_products(id, sku, name, unit))')
    .eq('is_deleted', false)
    .eq('is_active', true)
    .order('treatment_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { treatment_name, treatment_code, description, items } = body

  if (!treatment_name?.trim()) return NextResponse.json({ error: 'treatment_name is required' }, { status: 400 })
  if (!treatment_code?.trim()) return NextResponse.json({ error: 'treatment_code is required' }, { status: 400 })

  const { data: recipe, error: recipeErr } = await supabaseAdmin
    .from('treatment_recipes')
    .insert({ treatment_name: treatment_name.trim(), treatment_code: treatment_code.trim().toUpperCase(), description })
    .select()
    .single()

  if (recipeErr) return NextResponse.json({ error: recipeErr.message }, { status: 500 })

  if (items?.length) {
    const { error: itemsErr } = await supabaseAdmin
      .from('treatment_recipe_items')
      .insert(items.map((i: { product_id: string; quantity: number; unit: string; notes?: string }) => ({
        recipe_id: recipe.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit: i.unit,
        notes: i.notes,
      })))

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }

  return NextResponse.json(recipe, { status: 201 })
}
