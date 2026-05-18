import { CountryRepository } from "./countries.repository"
import type { Country } from "./countries.type"
import type { CreateCountryInput, UpdateCountryInput } from "./countries.validation"

export const CountryService = {
  async getAll(): Promise<Country[]> {
    return CountryRepository.findAll()
  },

  async getById(id: string): Promise<Country> {
    const country = await CountryRepository.findById(id)
    if (!country) throw new Error("Country zone not found")
    return country
  },

  async create(input: CreateCountryInput): Promise<Country> {
    return CountryRepository.create(input)
  },

  async update(id: string, input: UpdateCountryInput): Promise<Country> {
    await CountryService.getById(id)
    return CountryRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return CountryRepository.delete(id)
  },
}
