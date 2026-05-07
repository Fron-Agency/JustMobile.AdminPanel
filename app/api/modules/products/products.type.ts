export type ProductColor = {
  id: string
  product_id: string
  name: string
  hex_code: string
  is_active: boolean
  photos: ProductPhoto[]
}

export type ProductPhoto = {
  id: string
  product_id: string
  color_id: string
  file_url: string
  is_primary: boolean
  sort_order: number
}

export type Product = {
  id: string
  plan_id: string
  plan_name: string
  name: string
  brand: string
  model: string
  description: string | null
  base_price: number
  is_active: boolean
  colors: ProductColor[]
}

export type CreateProductDto = {
  plan_id: string
  name: string
  brand: string
  model: string
  description?: string | null
  base_price: number
  is_active: boolean
}

export type UpdateProductDto = Partial<CreateProductDto>

export type CreateColorDto = {
  product_id: string
  name: string
  hex_code: string
  is_active: boolean
}

export type UpdateColorDto = Partial<Omit<CreateColorDto, "product_id">>

export type CreatePhotoDto = {
  product_id: string
  color_id: string
  file_url: string
  is_primary: boolean
  sort_order: number
}

export type UpdatePhotoDto = Partial<Omit<CreatePhotoDto, "product_id" | "color_id">>
