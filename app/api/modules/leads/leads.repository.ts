import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Lead, CreateLeadRepositoryDto, UpdateLeadDto, AddressDto, LeadWithRelations } from "./leads.type"

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

  async findAllLeadsWithRelations(): Promise<LeadWithRelations[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        address (
          *
        ),
        plans (
          id,
          name,
          price,
          data_gb,
          network_technology,
          contract_length,
          discount,
          is_favorite,

          providers (
            name,
            file_url,
            categories (
              name
            )
          ),

          countries (
            name
          ),

          products (
            id,
            name,
            brand,
            model,
            description,
            base_price,
            is_active,

            products_colors (
              id,
              name,
              hex_code,
              is_active,

              products_photos (
                id,
                file_url,
                is_primary,
                sort_order
              )
            )
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data.map((item: any) => ({
      ...item
    }))
  },

  async findReferrals(): Promise<any[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("leads")
      .select("id, fullname, email, phone, referred_by_lead_id")
      .not("referred_by_lead_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    if (!data?.length) return []

    const referrerIds = [...new Set(data.map((r: any) => r.referred_by_lead_id))]

    const { data: referrers, error: refError } = await supabase
      .from("leads")
      .select("id, fullname, email, phone")
      .in("id", referrerIds)

    if (refError) throw new Error(refError.message)

    const referrerMap = Object.fromEntries((referrers ?? []).map((r: any) => [r.id, r]))

    return data.map((row: any) => ({
      ...row,
      referrer: referrerMap[row.referred_by_lead_id] ?? null,
    }))
  },

  async findByReferralCode(code: string): Promise<{ id: string } | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle()
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

    async create(payload: CreateLeadRepositoryDto): Promise<Lead> {
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
          documents.map((fileUrl: string) =>
            LeadRepository.insertDocument(data.id, fileUrl)
          )
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
