import { LeadRepository } from "./leads.repository"
import type { CreateLeadDto, CreateLeadRepositoryDto, Lead, UpdateLeadDto} from "./leads.type"

function generateReferralCode(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase()
}

export const LeadService = {
  async getReferrals() {
    return LeadRepository.findReferrals()
  },

  async getAll(): Promise<Lead[]> {
    return LeadRepository.getAll()
  },
  
  async getAllLeadsWithRelations() {
    return LeadRepository.findAllLeadsWithRelations()
  },

  async getById(id: string): Promise<Lead> {
    const lead = await LeadRepository.findById(id)
    if (!lead) throw new Error("Lead not found")
    return lead
  },

  async create(input: CreateLeadRepositoryDto): Promise<Lead> {
    const referral_code = generateReferralCode().toUpperCase()
    return LeadRepository.create({ ...input, referral_code })
  },

  async update(id: string, input: UpdateLeadDto): Promise<Lead> {
    await LeadService.getById(id)

    console.log({
      incoming: input.applied_referral_code,
      normalized: input.applied_referral_code?.trim().toUpperCase(),
    })

    let referred_by_lead_id: string | null = null
    if (input.applied_referral_code) {
      const referrer = await LeadRepository.findByReferralCode(input.applied_referral_code)
      referred_by_lead_id = referrer?.id ?? null
    }

    return LeadRepository.update(id, { ...input, referred_by_lead_id })
  },

  async delete(id: string): Promise<void> {
    return LeadRepository.delete(id)
  },
}
