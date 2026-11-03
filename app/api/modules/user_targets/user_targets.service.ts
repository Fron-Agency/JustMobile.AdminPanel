import { UserTargetsRepository } from "./user_targets.repository"
import { isValidDateRange, type CreateUserTargetInput, type UpdateUserTargetInput } from "./user_targets.validation"
import type { UserTarget } from "./user_targets.types"
import { targetAppliesToAgent } from "@/lib/sales-format"

export const UserTargetsService = {
  // team: only targets that apply to that team, i.e. the team's own targets
  // plus targets without a team (those apply to everyone).
  async getAll(asService = false, team?: string): Promise<UserTarget[]> {
    const targets = await UserTargetsRepository.findAll(asService)
    return team ? targets.filter((t) => targetAppliesToAgent(t.team, team)) : targets
  },

  async getById(id: string, asService = false): Promise<UserTarget> {
    const target = await UserTargetsRepository.findById(id, asService)
    if (!target) throw new Error("Target not found")
    return target
  },

  async create(input: CreateUserTargetInput): Promise<UserTarget> {
    return UserTargetsRepository.create(input)
  },

  async update(id: string, input: UpdateUserTargetInput): Promise<UserTarget> {
    const existing = await UserTargetsService.getById(id)

    const startDate = input.start_date ?? existing.start_date
    const endDate = input.end_date !== undefined ? input.end_date : existing.end_date
    if (!isValidDateRange(startDate, endDate)) {
      throw new Error("End date must be on or after start date")
    }

    return UserTargetsRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    await UserTargetsService.getById(id)
    return UserTargetsRepository.delete(id)
  },
}
