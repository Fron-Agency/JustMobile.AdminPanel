import { LeadRepository } from "./leads.repository"
import type { UpdateLeadInput } from "./leads.validation"
import type { CreateLeadDto, Lead } from "./leads.type"

function generateReferralCode(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase()
}

export const LeadService = {
  async getReferrals() {
    return LeadRepository.findReferrals()
  },
  
  async getAllLeadsWithRelations() {
    return LeadRepository.findAllLeadsWithRelations()
  },

  async getById(id: string): Promise<Lead> {
    const lead = await LeadRepository.findById(id)
    if (!lead) throw new Error("Lead not found")
    return lead
  },

  async create(input: CreateLeadDto): Promise<Lead> {
    const referral_code = generateReferralCode()

    let referred_by_lead_id: string | null = null
    if (input.applied_referral_code) {
      const referrer = await LeadRepository.findByReferralCode(input.applied_referral_code)
      referred_by_lead_id = referrer?.id ?? null
    }

    return LeadRepository.create({ ...input, referral_code, referred_by_lead_id })
  },

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    await LeadService.getById(id)
    return LeadRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return LeadRepository.delete(id)
  },
}
