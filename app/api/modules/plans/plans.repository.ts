import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Plan, CreatePlanDto, UpdatePlanInput } from "./plans.type"

async function client() {
  return createClient(await cookies())
}

export const PlanRepository = {
  async findAll(): Promise<Plan[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .select(`*, countries(name), providers(name)`)

    if (error) throw new Error(error.message)
    return data.map(({ providers: providerObj, countries: countriesArr, ...rest }: any) => ({
      ...rest,
      provider_name: providerObj?.name ?? "",
      countries: countriesArr.map((c: any) => c.name),
    }))
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