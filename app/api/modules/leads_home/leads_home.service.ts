import { LeadHomeRepository } from "./leads_home.repository"
import type { CreateLeadHomeDto, LeadHome, UpdateLeadDto } from "./leads_home.type"

export const LeadHomeService = {
  async getAll(): Promise<LeadHome[]> {
    return LeadHomeRepository.findAll()
  },

  async getById(id: string): Promise<LeadHome> {
    const lead = await LeadHomeRepository.findById(id)
    if (!lead) throw new Error("Lead home not found")
    return lead
  },

  async create(input: CreateLeadHomeDto): Promise<LeadHome> {
    return LeadHomeRepository.create(input)
  },

  async update(id: string, input: UpdateLeadDto): Promise<LeadHome> {
    await LeadHomeService.getById(id)
    return LeadHomeRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return LeadHomeRepository.delete(id)
  },
}
