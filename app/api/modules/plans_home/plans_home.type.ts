import { Product } from "../products/products.type"

export interface PlanHomeFeature {
  label: string
  value: string
}

export interface PlanHomeJsonBlock {
  title: string
  features: PlanHomeFeature[]
}

export type PlanHomeLanguage = "en" | "de" | "fr" | "it"

export interface PlanHomeLocalizedBlock {
  en?: PlanHomeJsonBlock
  de?: PlanHomeJsonBlock
  fr?: PlanHomeJsonBlock
  it?: PlanHomeJsonBlock
}

/** Legacy single-language block or localized block keyed by language. */
export type PlanHomeContentBlock = PlanHomeJsonBlock | PlanHomeLocalizedBlock

export interface PlanHome {
  id: string
  name: string
  price: number
  discount_price: number | null
  without_mobile_price: number | null
  provider_id: string
  contract_duration: string | null
  internet_content: PlanHomeContentBlock | null
  tv: PlanHomeContentBlock | null
  telephony: PlanHomeContentBlock | null
  other: PlanHomeContentBlock | null
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
  internet_content?: PlanHomeContentBlock | null
  tv?: PlanHomeContentBlock | null
  telephony?: PlanHomeContentBlock | null
  other?: PlanHomeContentBlock | null
}

export type UpdatePlanHomeDto = Partial<CreatePlanHomeDto>
