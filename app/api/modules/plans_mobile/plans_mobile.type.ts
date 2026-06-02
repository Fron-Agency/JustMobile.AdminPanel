import { MenuProduct } from "../categories/categories.type"

export type CountryZoneEntry = {
  id?: string
  country_id: string
  country_name?: string
  data: string | null
}

export type PlanMobile = {
  id: string
  name: string
  provider_id: string
  provider_name: string
  provider_file_url?: string
  category_name: string
  price: number
  product_price: number
  data_gb: number | null
  network_technology: string
  contract_length: number
  discount: number
  is_favorite: boolean
  data_gb_europe: number | null
  country_zones: CountryZoneEntry[]
}

export type ExternalPlanMobileDto = {
  id: string
  name: string
  provider_name: string
  provider_file_url: string
  price: number
  product_price: number
  data_gb: number | null
  network_technology: string
  contract_length: number
  discount: number
  is_favorite: boolean
  category_name: string
  products: MenuProduct[] | null
  data_gb_europe: number | null
  country_zones: CountryZoneEntry[]
}

export type CreatePlanMobileDto = {
  name: string
  provider_id: string
  price: number
  product_price: number
  data_gb: number | null
  network_technology: string
  contract_length: number
  discount: number
  is_favorite: boolean
  data_gb_europe: number | null
}

export type UpdatePlanMobileInput = Partial<CreatePlanMobileDto>
