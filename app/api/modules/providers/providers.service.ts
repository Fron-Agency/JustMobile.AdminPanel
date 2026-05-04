import { ProviderRepository } from "./providers.repository"
import type { CreateProviderInput, UpdateProviderInput } from "./providers.validation"
import type { Provider, ProviderWithCategory } from "./providers.type"

export const ProviderService = {
  async getAll(): Promise<Provider[]> {
    return ProviderRepository.findAll()
  },

  async getProvidersAndCategories() : Promise<ProviderWithCategory[]> {
    return ProviderRepository.findProvidersWithCategories()
  },

  async getById(id: string): Promise<Provider> {
    const provider = await ProviderRepository.findById(id)
    if (!provider) throw new Error("Provider not found")
    return provider
  },

  async create(input: CreateProviderInput): Promise<Provider> {
    return ProviderRepository.create({
      ...input,
      created_at: new Date().toISOString().split("T")[0],
      is_active: true,
    })
  },

  async update(id: string, input: UpdateProviderInput): Promise<Provider> {
    await ProviderService.getById(id)
    return ProviderRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return ProviderRepository.delete(id)
  },
}