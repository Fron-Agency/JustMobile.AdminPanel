import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Plan, CreatePlanDto, UpdatePlanInput, ExternalPlanDto } from "./plans.type"

async function client() {
  return createClient(await cookies())
}

export const PlanRepository = {
  async findAll(): Promise<ExternalPlanDto[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("plans")
      .select(`
        *,
        countries(name),
        providers(
          id,
          name,
          file_url,
          categories(name)
        )
      `)

    if (error) throw new Error(error.message)

    return data.map(({ providers, countries, ...rest }: any) => ({
      ...rest,
      provider_name: providers?.name ?? "",
      provider_file_url: providers?.file_url ?? "",
      category_name: providers?.categories?.name ?? "",
      countries: countries?.map((c: any) => c.name) ?? [],
    }))
  },

  async findAllExternal(): Promise<ExternalPlanDto[]> {
    const supabase = await client()
    const { data, error } = await supabase
    .from("plans")
    .select(`
      id,
      name,
      price,
      data_gb,
      network_technology,
      contract_length,
      discount,
      is_favorite,
      countries(name),
      providers(
        name,
        file_url,
        categories(name)
      )
    `)

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => {
      const provider = Array.isArray(row.providers) ? row.providers[0] : row.providers
      const category = Array.isArray(provider?.categories)
        ? provider.categories[0]
        : provider?.categories
    
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
    
        countries: row.countries?.map((c: any) => c.name) ?? [],
      }
    })
  },

  async findById(id: string): Promise<Plan | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .select(`*, countries(name), providers(name)`)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    const { providers: providerObj, countries: countriesArr, ...rest } = data as any
    return {
      ...rest,
      provider_name: providerObj?.name ?? "",
      countries: countriesArr?.map((c: any) => c.name) ?? [],
    }
  },

  async create(payload: CreatePlanDto): Promise<Plan> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdatePlanInput): Promise<Plan> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("plans").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  async insertCountries(planId: string, countries: string[]) {
    const supabase = await client()

    const payload = countries.map((name) => ({
      name,
      plan_id: planId,
    }))

    const { error } = await supabase
      .from("countries")
      .insert(payload)

    if (error) throw new Error(error.message)
  },

  async deleteCountries(planId: string) : Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("countries").delete().eq("plan_id", planId)
    if (error) throw new Error(error.message)
  },
}