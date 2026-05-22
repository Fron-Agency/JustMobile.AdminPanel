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
    const { address, ...leadPayload } = payload

    let data: LeadHome | null = null

    if (Object.keys(leadPayload).length > 0) {
      const { data: updatedData, error } = await supabase
        .from("leads_home")
        .update(leadPayload)
        .eq("id", id)
        .select(LEAD_HOME_SELECT)
        .single()

      if (error) throw new Error(error.message)
      if (!updatedData) throw new Error("Lead home not found")
      data = updatedData
    } else {
      data = await LeadHomeRepository.findById(id)
      if (!data) throw new Error("Lead home not found")
    }

    if (address && address.zip_code && address.city) {
      await LeadHomeRepository.upsertAddress(id, address)
    }

    if (!data) throw new Error("Lead home not found")
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("leads_home").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  async upsertAddress(leadHomeId: string, address: AddressDto): Promise<void> {
    const supabase = await client()

    const { data: existingAddress, error: selectError } = await supabase
      .from("address")
      .select("id")
      .eq("lead_home_id", leadHomeId)
      .limit(1)
      .maybeSingle()

    if (selectError) throw new Error(selectError.message)

    if (existingAddress?.id) {
      const { error: updateError } = await supabase
        .from("address")
        .update({
          zip_code: address.zip_code,
          city: address.city,
          street: address.street ?? null,
          number: address.number ?? null,
        })
        .eq("id", existingAddress.id)

      if (updateError) throw new Error(updateError.message)
      return
    }

    await LeadHomeRepository.insertAddress(leadHomeId, address)
  },

  async insertAddress(leadHomeId: string, address: AddressDto): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("address").insert([{
      lead_home_id: leadHomeId,
      lead_id: null,
      zip_code: address.zip_code,
      city: address.city,
      street: address.street ?? null,
      number: address.number ?? null,
    }])
    if (error) throw new Error(error.message)
  },
}
