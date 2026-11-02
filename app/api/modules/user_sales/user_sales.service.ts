import { UserSalesRepository } from "./user_sales.repository"
import type { CreateUserSalesInput, UpdateUserSalesInput } from "./user_sales.validation"
import type { UserSales } from "./user_sales.types"

export const UserSalesService = {
  async getAll(asService = false): Promise<UserSales[]> {
    return UserSalesRepository.findAll(asService)
  },

  async getById(id: string, asService = false): Promise<UserSales> {
    const userSales = await UserSalesRepository.findById(id, asService)
    if (!userSales) throw new Error("Sales agent not found")
    return userSales
  },

  async create(input: CreateUserSalesInput): Promise<UserSales> {
    return UserSalesRepository.create({ ...input, sales: 0 })
  },

  async update(id: string, input: UpdateUserSalesInput): Promise<UserSales> {
    await UserSalesService.getById(id)
    return UserSalesRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    await UserSalesService.getById(id)
    return UserSalesRepository.delete(id)
  },
}
