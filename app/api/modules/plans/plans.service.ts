
import type { CreatePlanInput, UpdatePlanInput } from "./plans.validation"
import { PlanRepository } from "./plans.repository"
import type { Plan } from "./plans.type"

export const PlanService = {
  async getAll(): Promise<Plan[]> {
    return PlanRepository.findAll()
  },

  async getById(id: string): Promise<Plan> {
    const plan = await PlanRepository.findById(id)
    if (!plan) throw new Error("Plan not found")
    return plan
  },
  async create(input: CreatePlanInput): Promise<Plan> {
    return PlanRepository.create({
      ...input,
      contract_length: 0, // Default value, adjust as needed
      discount: 0, // Default value, adjust as needed
      is_favorite: input.is_favorite ?? false, // Default to false if not provided
    })
  },

  async update(id: string, input: UpdatePlanInput): Promise<Plan> {
    await PlanService.getById(id)
    return PlanRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return PlanRepository.delete(id)
  },
}