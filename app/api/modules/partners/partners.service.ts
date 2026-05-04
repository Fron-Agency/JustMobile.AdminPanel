import { PartnerRepository } from "./partners.repository"
import type { CreatePartnerInput, UpdatePartnerInput } from "./partners.validation"
import type { Partners } from "./partners.type"

export const PartnerService = {
  async getAll(): Promise<Partners[]> {
    return PartnerRepository.findAll()
  },

  async getById(id: string): Promise<Partners> {
    const partner = await PartnerRepository.findById(id)
    if (!partner) throw new Error("Partner not found")
    return partner
  },

  async create(input: CreatePartnerInput): Promise<Partners> {
    return PartnerRepository.create({
      ...input,
    })
  },

  async update(id: string, input: UpdatePartnerInput): Promise<Partners> {
    await PartnerService.getById(id)
    return PartnerRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return PartnerRepository.delete(id)
  },
}