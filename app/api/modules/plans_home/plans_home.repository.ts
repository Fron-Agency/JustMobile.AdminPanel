import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { PlanHome, PlanHomeWithProvider, CreatePlanHomeDto, UpdatePlanHomeDto } from "./plans_home.type"

async function client() {
  return createClient(await cookies())
}

export const PlanHomeRepository = {
  async findAll(): Promise<PlanHomeWithProvider[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .select(`*, providers(name, file_url)`)
      .order("name", { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      ...row,
      provider_name: row.providers?.name ?? "",
      provider_file_url: row.providers?.file_url ?? "",
    }))
  },

  async findById(id: string): Promise<PlanHomeWithProvider | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans_home")
      .select(`*, providers(name, file_url)`)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return {
      ...data,
      provider_name: (data as any).providers?.name ?? "",
      provider_file_url: (data as any).providers?.file_url ?? "",
    }
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
