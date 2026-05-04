export type Category = {
  id: string
  name: string
  badge?: string
  is_active: boolean
}

export type CategoryProvidersAndPlans = {
  id: string
  name: string
  badge?: string
  is_active: boolean
  providers: {
    id: string
    name: string
    file_url: string
    is_active: boolean
    plans: {
      id: string
      provider_id: string
      name: string
      price: number
      data_gb: number
      network_technology: string
      contract_length: number
      discount: number
      is_favorite: boolean
    }[]
  }[]
}

export type CreateCategoryDto = {
  name: string
  badge?: string
  is_active: boolean
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>