import { UserTargetsRepository } from "./user_targets.repository"
import { isValidDateRange, type CreateUserTargetInput, type UpdateUserTargetInput } from "./user_targets.validation"
import type { UserTarget } from "./user_targets.types"

export const UserTargetsService = {
  async getAll(asService = false): Promise<UserTarget[]> {
    return UserTargetsRepository.findAll(asService)
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
