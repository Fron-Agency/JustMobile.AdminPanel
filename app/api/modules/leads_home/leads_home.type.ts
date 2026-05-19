import { AddressDto } from "../leads/leads.type"

export type LeadHome = {
  id: string
  created_at: string
  name: string
  lastname: string
  mobile_number: string | null
  date_of_birth: string
  nationality: string
  document_type: string
  document_number: string
  plan_home_id: string
  oto_number: string | null
  email: string
  arriving_date: string | null
  landline_number: string | null
  swiss_number: boolean
  provider_name: string | null
  oto_provider: string | null
  comment: string | null
  status: "new" | "sent" | "contacted" | "converted" | "lost"
  address?: AddressDto
}

export type CreateLeadHomeDto = Omit<LeadHome, "id" | "created_at"> & {
  address: AddressDto
}

export type UpdateLeadDto = Partial<CreateLeadHomeDto>