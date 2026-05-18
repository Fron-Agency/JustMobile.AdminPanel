import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { PlanHome, PlanHomeWithProvider, CreatePlanHomeDto, UpdatePlanHomeDto } from "./plans_home.type"

async function client() {
  return createClient(await cookies())
}

function mapRow(row: any): PlanHomeWithProvider {
  const p = row.products ?? null
  return {
    ...row,
    provider_name: row.providers?.name ?? "",
    provider_file_url: row.providers?.file_url ?? "",
    product: p ? {
      id: p.id,
      plan_mobile_id: p.plan_mobile_id ?? null,
      plan_home_id: p.plan_home_id ?? null,
      plan_mobile_name: null,
      plan_home_name: null,
      name: p.name,
      brand: p.brand,
      model: p.model,
      description: p.description ?? null,
      base_price: p.base_price,
      is_active: p.is_active,
      colors: (p.products_colors ?? []).map((c: any) => ({
        id: c.id,
        product_id: p.id,
        name: c.name,
        hex_code: c.hex_code,
        is_active: c.is_active,
        photos: (c.products_photos ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((ph: any) => ({
            id: ph.id,
            product_id: p.id,
            color_id: c.id,
            file_url: ph.file_url,
            is_primary: ph.is_primary,
            sort_order: ph.sort_order,
          })),
      })),
    } : null,
  }
}

export const PlanHomeRepository = {
  async findAll(): Promise<PlanHomeWithProvider[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .select(`
        *,
        providers(name, file_url),
        products(
          id, plan_mobile_id, plan_home_id, name, brand, model, description, base_price, is_active,
          products_colors(
            id, name, hex_code, is_active,
            products_photos(id, file_url, is_primary, sort_order)
          )
        )
      `)
      .order("name", { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapRow)
  },

  async findById(id: string): Promise<PlanHomeWithProvider | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .select(`
        *,
        providers(name, file_url),
        products(
          id, plan_mobile_id, plan_home_id, name, brand, model, description, base_price, is_active,
          products_colors(
            id, name, hex_code, is_active,
            products_photos(id, file_url, is_primary, sort_order)
          )
        )
      `)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return mapRow(data)
  },

  async create(payload: CreatePlanHomeDto): Promise<PlanHome> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdatePlanHomeDto): Promise<PlanHome> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("plans_home").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
