import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Lead, CreateLeadDto, UpdateLeadDto } from "./leads.type"

async function client() {
  return createClient(await cookies())
}

export const LeadRepository = {
  async findAll(): Promise<Lead[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Lead | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateLeadDto): Promise<Lead> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateLeadDto): Promise<Lead> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("leads").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
