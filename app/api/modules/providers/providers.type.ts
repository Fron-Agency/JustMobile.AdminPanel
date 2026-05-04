export type Provider = {
  id: string
  name: string
  category_id: string
  created_at: string
  is_active: boolean
  file_url: string | null
}

export type CreateProviderDto = {
  name: string
  category_id: string
  created_at: string
  is_active: boolean
  file_url?: string | null
}

export type UpdateProviderDto = Partial<CreateProviderDto>