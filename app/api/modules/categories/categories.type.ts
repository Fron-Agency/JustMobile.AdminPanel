import { PlanHome } from "../plans_home/plans_home.type"

export type Category = {
  id: string
  name: string
  badge?: string
  is_active: boolean
}

export type MenuPhoto = {
  id: string
  file_url: string
  is_primary: boolean
  sort_order: number
}

export type MenuColor = {
  id: string
  name: string
  hex_code: string
  is_active: boolean
  products_photos: MenuPhoto[]
}

export type MenuProduct = {
  id: string
  name: string
  brand: string
  model: string
  description: string | null
  base_price: number
  is_active: boolean
  products_colors: MenuColor[]
}

export type MenuPlan = {
  id: string
  provider_id: string
  name: string
  price: number
  product_price: number | null
  data_gb: number | null
  network_technology: string
  contract_length: number
  discount: number
  is_favorite: boolean
  products: MenuProduct[]
}

export type CategoryProvidersAndMobilePlans = {
  id: string
  name: string
  badge?: string
  is_active: boolean
  providers: {
    id: string
    name: string
    file_url: string
    is_active: boolean
    plans_mobile: MenuPlan[]
    plans_home: PlanHome[]
  }[]
}

export type CreateCategoryDto = {
  name: string
  badge?: string
  is_active: boolean
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>