import { PlanHomeRepository } from "./plans_home.repository"
import type { PlanHomeWithProvider } from "./plans_home.type"
import type { CreatePlanHomeInput, UpdatePlanHomeInput } from "./plans_home.validation"

export const PlanHomeService = {
  async getAll(): Promise<PlanHomeWithProvider[]> {
    return PlanHomeRepository.findAll()
  },

  async getById(id: string): Promise<PlanHomeWithProvider> {
    const plan = await PlanHomeRepository.findById(id)
    if (!plan) throw new Error("Home plan not found")
    return plan
  },

  async create(input: CreatePlanHomeInput): Promise<PlanHomeWithProvider> {
    const plan = await PlanHomeRepository.create(input)
    return (await PlanHomeRepository.findById(plan.id))!
  },

  async update(id: string, input: UpdatePlanHomeInput): Promise<PlanHomeWithProvider> {
    await PlanHomeService.getById(id)
    await PlanHomeRepository.update(id, input)
    return (await PlanHomeRepository.findById(id))!
  },

  async delete(id: string): Promise<void> {
    return PlanHomeRepository.delete(id)
  },
}
