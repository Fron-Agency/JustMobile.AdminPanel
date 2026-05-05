export type AddressDto = {
  zip_code: string
  city: string
  street?: string | null
  number?: string | null
}

export type Lead = {
  id: string
  fullname: string
  email: string
  phone: string | null
  plan_id: string
  file_url: string | null
  status: "new" | "sent" | "contacted" | "converted" | "lost"
  created_at: string
  date_of_birth?: string | null
  swiss_number?: boolean | null
  keep_swiss_number?: boolean | null
  roaming_control?: boolean | null
  child_date_of_birth?: string | null
  description?: string | null
  address?: AddressDto
}

export type CreateLeadDto = Omit<Lead, "id" | "created_at" | "address"> & {
  address: AddressDto
}

export type UpdateLeadDto = Partial<CreateLeadDto>