import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Category, CategoryProvidersAndPlans, CreateCategoryDto, UpdateCategoryDto } from "./categories.type"

async function client() {
  return createClient(await cookies())
}

export const CategoryRepository = {
  async findAll(): Promise<Category[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      
    if (error) throw new Error(error.message)
    return data
  },

  async findCategoriesWithProvidersAndPlans() : Promise<CategoryProvidersAndPlans[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .select(`*,
        providers (
          id,
          name,
          file_url,
          is_active,
          plans (
            *
          )
        )
      `)
      .eq("is_active", true)
      .eq("providers.is_active", true)
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Category | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateCategoryDto): Promise<Category> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateCategoryDto): Promise<Category> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}