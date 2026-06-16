export type LimitedOffersDto = {
  id: string
  plan_mobile_id: string
  email: string
  time: string
  created_at: string
}

export type CreateLimitedOffers = Omit<LimitedOffersDto, "id" | "created_at" | "time">