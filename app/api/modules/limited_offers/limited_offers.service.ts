import { LimitedOffersRepository } from "./limited_offers.repository"
import { CreateLimitedOffers, LimitedOffersDto } from "./limited_offers.type"

export const LimitedOffersService = {
  async get() {
    return LimitedOffersRepository.findAll()
  },

  async create(input: CreateLimitedOffers): Promise<LimitedOffersDto> {
    return LimitedOffersRepository.create(input)
  },
}
