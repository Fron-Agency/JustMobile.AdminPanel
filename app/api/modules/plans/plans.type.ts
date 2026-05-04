export type Plan = {
    id: string
    name: string
    provider_id: string
    price: number
    data_gb: number
    network_technology: string
    contract_length: number
    discount: number
    is_favorite: boolean
  }
  
  export type CreatePlanDto = {
    name: string
    provider_id: string
    price: number
    data_gb: number
    network_technology: string
    contract_length: number
    discount: number
    is_favorite: boolean
  }

  export type UpdatePlanInput = Partial<CreatePlanDto>