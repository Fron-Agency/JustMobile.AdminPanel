
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
    const { countries, ...planData } = input

    const plan = await PlanRepository.create({
      ...planData,
      contract_length: 0,
      discount: 0,
      is_favorite: input.is_favorite ?? false,
    })

    await PlanRepository.insertCountries(plan.id, countries)

    return (await PlanRepository.findById(plan.id))!
  },

  async update(
    id: string,
    input: UpdatePlanInput & { countries?: string[] }
  ): Promise<Plan> {
    await PlanService.getById(id)

    const { countries, ...planData } = input

    if (countries !== undefined) {
      await PlanRepository.deleteCountries(id)
      await PlanRepository.insertCountries(id, countries)
    }

    await PlanRepository.update(id, planData)

    return (await PlanRepository.findById(id))!
  },

  async delete(id: string): Promise<void> {
    return PlanRepository.delete(id)
  },
}