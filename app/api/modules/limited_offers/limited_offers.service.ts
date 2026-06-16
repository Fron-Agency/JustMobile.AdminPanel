import { LimitedOffersRepository } from "./limited_offers.repository"
import { LimitedOffersDto } from "./limited_offers.type"
import { CreateLimitedOffers } from "./limited_offers.validation"

export const LimitedOffersService = {
  async get() {
    return LimitedOffersRepository.findAll()
  },

  async getByEmail(email: string) {
    return LimitedOffersRepository.findByEmail(email)
  },

  async create(input: CreateLimitedOffers): Promise<LimitedOffersDto> {
    return LimitedOffersRepository.create(input)
  },
}
