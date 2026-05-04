import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Partners, CreatePartnerDto, UpdatePartnerDto } from "./partners.type"

async function client() {
  return createClient(await cookies())
}

export const PartnerRepository = {
  async findAll(): Promise<Partners[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false })
      
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Partners | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreatePartnerDto): Promise<Partners> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("partners")
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdatePartnerDto): Promise<Partners> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("partners")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("partners").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}