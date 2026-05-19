import { Product } from "../products/products.type"

export interface PlanHomeFeature {
  label: string
  value: string
}

export interface PlanHomeJsonBlock {
  title: string
  features: PlanHomeFeature[]
}

export interface PlanHome {
  id: string
  name: string
  price: number
  discount_price: number | null
  without_mobile_price: number | null
  provider_id: string
  contract_duration: string | null
  internet_content: PlanHomeJsonBlock | null
  tv: PlanHomeJsonBlock | null
  telephony: PlanHomeJsonBlock | null
  other: PlanHomeJsonBlock | null
}

export interface PlanHomeWithProvider extends PlanHome {
  provider_name: string
  provider_file_url: string
  product: Product | null
}

export interface CreatePlanHomeDto {
  name: string
  price: number
  discount_price?: number | null
  without_mobile_price?: number | null
  provider_id: string
  contract_duration?: string | null
  internet_content?: PlanHomeJsonBlock | null
  tv?: PlanHomeJsonBlock | null
  telephony?: PlanHomeJsonBlock | null
  other?: PlanHomeJsonBlock | null
}

export type UpdatePlanHomeDto = Partial<CreatePlanHomeDto>
