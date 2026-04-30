export type Provider = {
  id: string
  name: string
  category_id: string
  created_at: string
  is_active: boolean
}

export type CreateProviderDto = {
  name: string
  category_id: string
  created_at: string
  is_active: boolean
}

export type UpdateProviderDto = Partial<CreateProviderDto>