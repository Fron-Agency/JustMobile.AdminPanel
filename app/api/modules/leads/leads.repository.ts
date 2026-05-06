import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Lead, CreateLeadDto, UpdateLeadDto, AddressDto } from "./leads.type"

async function client() {
  return createClient(await cookies())
}

const LEAD_SELECT = `
  *,
  address(zip_code, city, street, number),
  documents(id, file_url)
`

export const LeadRepository = {
  async findAll(): Promise<Lead[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_SELECT)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Lead | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .select(LEAD_SELECT)
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateLeadDto): Promise<Lead> {
    const supabase = await client()
    const { address, documents, ...leadPayload } = payload

    const { data, error } = await supabase
      .from("leads")
      .insert([{ ...leadPayload, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw new Error(error.message)

    await LeadRepository.insertAddress(data.id, address)

    if (documents && documents.length > 0) {
      await Promise.all(
        documents.map((fileUrl: string) => LeadRepository.insertDocument(data.id, fileUrl))
      )
    }

    return data
  },

  async update(id: string, payload: UpdateLeadDto): Promise<Lead> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", id)
      .select(LEAD_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("leads").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },

  async insertAddress(leadId: string, address: AddressDto): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("address").insert([{
      lead_id: leadId,
      zip_code: address.zip_code,
      city: address.city,
      street: address.street ?? null,
      number: address.number ?? null,
    }])
    if (error) throw new Error(error.message)
  },

  async insertDocument(leadId: string, fileUrl: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("documents").insert([{ lead_id: leadId, file_url: fileUrl }])
    if (error) throw new Error(error.message)
  },

  async deleteDocument(documentId: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("documents").delete().eq("id", documentId)
    if (error) throw new Error(error.message)
  },
}
