import { LeadRepository } from "./leads.repository"
import type { UpdateLeadInput } from "./leads.validation"
import type { CreateLeadDto, Lead } from "./leads.type"

export const LeadService = {
  async getAll(): Promise<Lead[]> {
    return LeadRepository.findAll()
  },

  async getById(id: string): Promise<Lead> {
    const lead = await LeadRepository.findById(id)
    if (!lead) throw new Error("Lead not found")
    return lead
  },

  async create(input: CreateLeadDto): Promise<Lead> {
    return LeadRepository.create(input)
  },

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    await LeadService.getById(id)
    return LeadRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return LeadRepository.delete(id)
  },
}
