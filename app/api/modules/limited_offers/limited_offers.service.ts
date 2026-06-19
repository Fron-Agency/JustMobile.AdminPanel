import { LimitedOffersRepository } from "./limited_offers.repository"
import { LimitedOffersDto } from "./limited_offers.type"
import { CreateLimitedOffers } from "./limited_offers.validation"

export const LimitedOffersService = {
  async findAll(startDate?: string | null, endDate?: string | null) {
    return LimitedOffersRepository.findAll(startDate, endDate)
  },

  async getByEmail(email: string, plan_id: string) {
    return LimitedOffersRepository.findByEmail(email, plan_id)
  },

  async create(input: CreateLimitedOffers): Promise<LimitedOffersDto> {
    return LimitedOffersRepository.create(input)
  },
}
