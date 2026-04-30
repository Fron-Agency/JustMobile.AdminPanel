import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Provider, CreateProviderDto, UpdateProviderDto } from "./providers.type"

async function client() {
  return createClient(await cookies())
}

export const ProviderRepository = {
  async findAll(): Promise<Provider[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false })
      
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Provider | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateProviderDto): Promise<Provider> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("providers")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateProviderDto): Promise<Provider> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("providers")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("providers").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}