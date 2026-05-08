import { ExternalPlanDto } from "../plans/plans.type"

export type AddressDto = {
  zip_code: string
  city: string
  street?: string | null
  number?: string | null
}

export type Document = {
  id: string
  file_url: string
  lead_id: string
}

export type Lead = {
  id: string
  fullname: string
  email: string
  phone: string | null
  plan_id: string
  status: "new" | "sent" | "contacted" | "converted" | "lost"
  created_at: string
  date_of_birth?: string | null
  swiss_number?: boolean | null
  keep_swiss_number?: boolean | null
  roaming_control?: boolean | null
  child_date_of_birth?: string | null
  is_child_order: boolean
  description?: string | null
  address?: AddressDto
  documents?: Document[]
  product_color_id?: string | null
  referred_by_lead_id?: string | null
  applied_referral_code?: string | null
}

export type LeadWithRelations =  Lead & {
  plan : ExternalPlanDto
}

export type CreateLeadDto = Omit<Lead, "id" | "created_at" | "address" | "documents" | "referral_code"> & {
  address: AddressDto
  documents?: string[]
}

export type CreateLeadRepositoryDto = CreateLeadDto & {
  referral_code: string
  referred_by_lead_id: string | null
}

export type UpdateLeadDto = Partial<CreateLeadDto>
