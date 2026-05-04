export type Lead = {
  id: string
  fullname: string
  email: string
  phone: string
  plan_id: string
  file_url: string | null
  status: "new" | "contacted" | "converted" | "lost"
  created_at: string
}

export type CreateLeadDto = {
  fullname: string
  email: string
  phone: string
  plan_id: string
  file_url?: string | null
  status: Lead["status"]
}

export type UpdateLeadDto = Partial<CreateLeadDto>
