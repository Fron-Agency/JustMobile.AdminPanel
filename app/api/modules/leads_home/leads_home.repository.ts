import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { LeadHome, CreateLeadHomeDto, UpdateLeadDto } from "./leads_home.type"
import type { AddressDto } from "../leads/leads.type"

async function client() {
  return createClient(await cookies())
}

const LEAD_HOME_SELECT = `
  *,
  address(zip_code, city, street, number)
`

export const LeadHomeRepository = {
  async findAll(): Promise<LeadHome[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads_home")
      .select(LEAD_HOME_SELECT)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<LeadHome | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads_home")
      .select(LEAD_HOME_SELECT)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateLeadHomeDto): Promise<LeadHome> {
    const supabase = await client()
    const { address, ...leadPayload } = payload

    const { data, error } = await supabase
      .from("leads_home")
      .insert([{ ...leadPayload, created_at: new Date().toISOString() }])
      .select()
      .single()

    if (error) throw new Error(error.message)

    await LeadHomeRepository.insertAddress(data.id, address)

    return data
  },

  async update(id: string, payload: UpdateLeadDto): Promise<LeadHome> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads_home")
      .update(payload)
      .eq("id", id)
      .select(LEAD_HOME_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("leads_home").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  async insertAddress(leadHomeId: string, address: AddressDto): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("address").insert([{
      lead_home_id: leadHomeId,
      zip_code: address.zip_code,
      city: address.city,
      street: address.street ?? null,
      number: address.number ?? null,
    }])
    if (error) throw new Error(error.message)
  },
}
