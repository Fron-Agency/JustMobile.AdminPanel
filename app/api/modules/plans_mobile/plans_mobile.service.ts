
import type { CreatePlanMobileInput, UpdatePlanMobileInput } from "./plans_mobile.validation"
import { PlanRepository } from "./plans_mobile.repository"
import type { ExternalPlanMobileDto, PlanMobile, PlanMobileFormDto } from "./plans_mobile.type"

type ZoneInput = { country_id: string; data: string | null; language: string | null }

export const PlanService = {
  async getAll(): Promise<ExternalPlanMobileDto[]> {
    return PlanRepository.findAll()
  },

  async getPlansCounter() : Promise<any> {
    return PlanRepository.getPlansCounter()
  },

  async getById(id: string): Promise<PlanMobile> {
    const plan = await PlanRepository.findById(id)
    if (!plan) throw new Error("Plan not found")
    return plan
  },

  async getAllExternal(): Promise<ExternalPlanMobileDto[]> {
    return PlanRepository.findAllExternal()
  },

  async create(input: CreatePlanMobileInput, zones: ZoneInput[] = []): Promise<PlanMobile> {
    return PlanRepository.create(
      {
        ...input,
        contract_length: input.contract_length ?? 0,
        discount: input.discount ?? 0,
        is_favorite: input.is_favorite ?? false,
        product_price: input.product_price ?? 0,
      },
      zones
    )
  },

  async update(id: string, input: UpdatePlanMobileInput, zones?: ZoneInput[]): Promise<PlanMobile> {
    await PlanService.getById(id)
    const sanitized = {
      ...input,
      contract_length: input.contract_length ?? undefined,
      discount: input.discount ?? undefined,
      product_price: input.product_price ?? undefined,
    }
    return PlanRepository.update(id, sanitized, zones)
  },

  async delete(id: string): Promise<void> {
    return PlanRepository.delete(id)
  },

  async getPlanMobileByName(provider: string ,name: string) : Promise<PlanMobileFormDto | null>{
    return await PlanRepository.findPlanMobileByName(provider, name);
  }
}
