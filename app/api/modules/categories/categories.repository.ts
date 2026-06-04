import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Category, CategoryProvidersAndMobilePlans, CreateCategoryDto, UpdateCategoryDto } from "./categories.type"

async function client() {
  return createClient(await cookies())
}

async function fetchCountryZones(supabase: any, planId: string) {
  const { data } = await supabase
    .from("countries_mobile_plans")
    .select("id, country_id, data, countries(name), language")
    .eq("plan_mobile_id", planId)

  if (!data) return []
  return data.map((row: any) => ({
    id: row.id,
    country_id: row.country_id,
    country_name: Array.isArray(row.countries) ? row.countries[0]?.name : row.countries?.name,
    data: row.data,
  }))
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

  async findCategoriesWithProvidersAndMobilePlans(): Promise<CategoryProvidersAndMobilePlans[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        providers (
          id,
          name,
          file_url,
          is_active,
          plans_mobile (
            id,
            provider_id,
            name,
            price,
            product_price,
            data_gb,
            network_technology,
            contract_length,
            discount,
            is_favorite,
            products (
              id,
              name,
              brand,
              model,
              description,
              base_price,
              is_active,
              products_colors (
                id,
                name,
                hex_code,
                is_active,
                products_photos (
                  id,
                  file_url,
                  is_primary,
                  sort_order
                )
              )
            )
          ),
          plans_home (
            id,
            name,
            price,
            discount_price,
            without_mobile_price,
            provider_id,
            contract_duration,
            internet_content,
            tv,
            telephony
          )
        )
      `)
      .eq("is_active", true)
      .eq("providers.is_active", true)
    if (error) throw new Error(error.message)
    if (!data) return []

    await Promise.all(
      data.map(async (category: any) => {
        const providers = Array.isArray(category.providers) ? category.providers : category.providers ? [category.providers] : []
        await Promise.all(
          providers.map(async (provider: any) => {
            const plans = Array.isArray(provider.plans_mobile)
              ? provider.plans_mobile
              : provider.plans_mobile
              ? [provider.plans_mobile]
              : []

            await Promise.all(
              plans.map(async (plan: any) => {
                plan.country_zones = await fetchCountryZones(supabase, plan.id)
              })
            )
          })
        )
      })
    )

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