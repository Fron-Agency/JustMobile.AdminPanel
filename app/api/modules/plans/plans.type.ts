export type Plan = {
  id: string
  name: string
  provider_id: string
  provider_name: string
  provider_file_url?: string
  category_name: string
  price: number
  data_gb: number | null
  network_technology: string
  contract_length: number
  discount: number
  is_favorite: boolean
  countries: string[]
}

  export type ExternalPlanDto = {
    id: string
    name: string
    provider_name: string
    provider_file_url: string
    price: number
    data_gb: number | null
    network_technology: string
    contract_length: number
    discount: number
    is_favorite: boolean
    countries: string[]
    category_name: string
  }
  
  export type CreatePlanDto = {
    name: string
    provider_id: string
    price: number
    data_gb: number | null
    network_technology: string
    contract_length: number
    discount: number
    is_favorite: boolean
  }

  export type UpdatePlanInput = Partial<CreatePlanDto>