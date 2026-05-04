export type Partners = {
  id: string
  name: string
  file_url: string | null
  created_at: string
}

export type CreatePartnerDto = {
  name: string
  file_url?: string | null
}

export type UpdatePartnerDto = Partial<CreatePartnerDto>