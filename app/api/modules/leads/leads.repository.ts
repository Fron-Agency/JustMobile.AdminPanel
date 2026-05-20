import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Lead, LeadWithRelations, CreateLeadRepositoryDto, UpdateLeadDto, AddressDto } from "./leads.type"

async function client() {
  return createClient(await cookies())
}

const LEAD_SELECT = `
  *,
  address(zip_code, city, street, number),
  documents(id, file_url)
`

export const LeadRepository = {
  async findAllLeadsWithRelations(): Promise<LeadWithRelations[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("leads")
      .select(`
        id,
        fullname,
        email,
        phone,
        plan_id,
        status,
        created_at,
        date_of_birth,
        swiss_number,
        keep_swiss_number,
        roaming_control,
        child_date_of_birth,
        is_child_order,
        description,
        referred_by_lead_id,
        applied_referral_code,
        product_color_id,

        address (*),

        documents (
          id,
          file_url,
          lead_id
        ),

        plans_mobile (
          id,
          name,

          providers (
            name,

            categories (
              name
            )
          ),

          products (
            id,
            name,

            products_colors (
              id,
              name,

              products_photos (
                id,
                file_url,
                is_primary
              )
            )
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const leads: LeadWithRelations[] = data.map((item: any) => {
      const plan = item.plans_mobile

      const provider = plan?.providers

      const category = provider?.categories

      const product = plan?.products?.[0]

      const color = product?.products_colors?.find(
        (c: any) => c.id === item.product_color_id
      )

      const photo =
        color?.products_photos?.find((p: any) => p.is_primary) ??
        color?.products_photos?.[0]

      return {
        id: item.id,
        fullname: item.fullname,
        email: item.email,
        phone: item.phone,

        plan_id: item.plan_id,
        plan_mobile_id: plan?.id ?? "",
        plan_mobile_name: plan?.name ?? "",

        plan_mobile_provider_name: provider?.name ?? "",

        plan_mobile_provider_category_name:
          category?.name ?? "",

        status: item.status,
        created_at: item.created_at,

        date_of_birth: item.date_of_birth,
        swiss_number: item.swiss_number,
        keep_swiss_number: item.keep_swiss_number,
        roaming_control: item.roaming_control,
        child_date_of_birth: item.child_date_of_birth,
        is_child_order: item.is_child_order,
        description: item.description,

        referred_by_lead_id: item.referred_by_lead_id,
        applied_referral_code: item.applied_referral_code,

        address: item.address,
        documents: item.documents,

        product_id: product?.id ?? "",
        product_name: product?.name ?? "",

        product_color_id: color?.id ?? null,
        product_color_name: color?.name ?? "",

        product_photo_id: photo?.id ?? "",
        product_photo_file_url: photo?.file_url ?? "",
      }
    })

    return leads
  },

  async getAll(): Promise<Lead[]>{
    const supabase = await client()

    const { data, error } = await supabase
      .from("leads")
      .select("*")

      if(error) throw new Error(error.message)
      
    return data;
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
      lead_home_id: null,
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