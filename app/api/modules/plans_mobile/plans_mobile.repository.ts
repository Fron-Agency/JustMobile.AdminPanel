import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { PlanMobile, CreatePlanMobileDto, UpdatePlanMobileInput, ExternalPlanMobileDto, CountryZoneEntry } from "./plans_mobile.type"

async function client() {
  return createClient(await cookies())
}

const PROVIDER_SELECT = `providers(id, name, file_url, categories(name))`

function mapProvider(row: any) {
  const p = Array.isArray(row.providers) ? row.providers[0] : row.providers
  const cat = Array.isArray(p?.categories) ? p.categories[0] : p?.categories
  return {
    provider_name: p?.name ?? "",
    provider_file_url: p?.file_url ?? "",
    category_name: cat?.name ?? "",
  }
}

async function fetchCountryZones(supabase: any, planId: string): Promise<CountryZoneEntry[]> {
  const { data } = await supabase
    .from("countries_mobile_plans")
    .select("id, country_id, data, countries(name)")
    .eq("plan_mobile_id", planId)
  if (!data) return []
  return data.map((row: any) => ({
    id: row.id,
    country_id: row.country_id,
    country_name: Array.isArray(row.countries) ? row.countries[0]?.name : row.countries?.name,
    data: row.data,
  }))
}

async function syncCountryZones(
  supabase: any,
  planId: string,
  zones: Array<{ country_id: string; data: string | null }>
): Promise<void> {
  await supabase.from("countries_mobile_plans").delete().eq("plan_mobile_id", planId)
  if (zones.length === 0) return
  const rows = zones.map((z) => ({ plan_mobile_id: planId, country_id: z.country_id, data: z.data }))
  const { error } = await supabase.from("countries_mobile_plans").insert(rows)
  if (error) throw new Error(error.message)
}

export const PlanRepository = {
  async findAll(): Promise<ExternalPlanMobileDto[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_mobile")
      .select(`*, ${PROVIDER_SELECT}`)
      .order("name", { ascending: true })
    if (error) throw new Error(error.message)
    const plans = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      data_gb: row.data_gb,
      network_technology: row.network_technology,
      contract_length: row.contract_length,
      discount: row.discount,
      is_favorite: row.is_favorite,
      ...mapProvider(row),
      products: null,
      data_gb_europe: row.data_gb_europe,
      country_zones: [] as CountryZoneEntry[],
    }))
    await Promise.all(
      plans.map(async (plan) => {
        plan.country_zones = await fetchCountryZones(supabase, plan.id)
      })
    )
    return plans
  },

  async findAllExternal(): Promise<ExternalPlanMobileDto[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_mobile")
      .select(`
        id, name, price, data_gb, network_technology, contract_length, discount, is_favorite,
        data_gb_europe,
        providers!inner(name, file_url, categories(name)),
        products(
          id, name, brand, model, description, base_price, is_active,
          products_colors(
            id, name, hex_code, is_active,
            products_photos(id, file_url, is_primary, sort_order)
          )
        )
      `)
      .eq("providers.is_active", true)
    if (error) throw new Error(error.message)
    const plans = (data ?? []).map((row: any) => {
      const provider = Array.isArray(row.providers) ? row.providers[0] : row.providers
      const category = Array.isArray(provider?.categories) ? provider.categories[0] : provider?.categories
      return {
        id: row.id,
        name: row.name,
        price: row.price,
        data_gb: row.data_gb,
        network_technology: row.network_technology,
        contract_length: row.contract_length,
        discount: row.discount,
        is_favorite: row.is_favorite,
        provider_name: provider?.name ?? "",
        provider_file_url: provider?.file_url ?? "",
        category_name: category?.name ?? "",
        products: (row.products ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          model: p.model,
          description: p.description ?? null,
          base_price: p.base_price,
          is_active: p.is_active,
          products_colors: (p.products_colors ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            hex_code: c.hex_code,
            is_active: c.is_active,
            products_photos: (c.products_photos ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((ph: any) => ({
                id: ph.id,
                file_url: ph.file_url,
                is_primary: ph.is_primary,
                sort_order: ph.sort_order,
              })),
          })),
        })),
        data_gb_europe: row.data_gb_europe,
        country_zones: [] as CountryZoneEntry[],
      }
    })
    await Promise.all(
      plans.map(async (plan) => {
        plan.country_zones = await fetchCountryZones(supabase, plan.id)
      })
    )
    return plans
  },

  async findById(id: string): Promise<PlanMobile | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_mobile")
      .select(`*, ${PROVIDER_SELECT}`)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    const country_zones = await fetchCountryZones(supabase, id)
    return {
      ...(data as any),
      ...mapProvider(data),
      country_zones,
    }
  },

  async create(
    payload: CreatePlanMobileDto,
    zones: Array<{ country_id: string; data: string | null }> = []
  ): Promise<PlanMobile> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_mobile")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    await syncCountryZones(supabase, data.id, zones)
    return (await PlanRepository.findById(data.id))!
  },

  async update(
    id: string,
    payload: UpdatePlanMobileInput,
    zones?: Array<{ country_id: string; data: string | null }>
  ): Promise<PlanMobile> {
    const supabase = await client()
    const { error } = await supabase
      .from("plans_mobile")
      .update(payload)
      .eq("id", id)
    if (error) throw new Error(error.message)
    if (zones !== undefined) {
      await syncCountryZones(supabase, id, zones)
    }
    return (await PlanRepository.findById(id))!
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("plans_mobile").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  async getPlansCounter() : Promise<number> {
    const supabase = await client()

    const { count, error } = await supabase
      .from("plans_mobile")
      .select("id", { count: "exact", head: true })

    if (error) throw new Error(error.message)

    return count ?? 0
  }
}
