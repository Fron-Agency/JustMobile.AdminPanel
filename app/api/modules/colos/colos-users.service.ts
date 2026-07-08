import { hashPassword } from "@/lib/password"
import { ColosUserRepository } from "./colos-users.repository"
import type { ColosUserDto } from "./colos-users.type"
import type { CreateColosUserInput, UpdateColosUserInput } from "./colos-users.validation"

export const ColosUserService = {
  async getAll(): Promise<ColosUserDto[]> {
    return ColosUserRepository.findAll()
  },

  async getById(id: string): Promise<ColosUserDto> {
    const user = await ColosUserRepository.findById(id)
    if (!user) throw new Error("User not found")
    return user
  },

  async create(input: CreateColosUserInput): Promise<ColosUserDto> {
    const passwordHash = await hashPassword(input.password)
    return ColosUserRepository.create({
      email: input.email,
      name: input.name ?? null,
      role: input.role,
      passwordHash,
    })
  },

  async update(id: string, input: UpdateColosUserInput): Promise<ColosUserDto> {
    await ColosUserService.getById(id)

    const passwordHash = input.password ? await hashPassword(input.password) : undefined

    return ColosUserRepository.update(id, {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(passwordHash !== undefined ? { passwordHash } : {}),
    })
  },

  async delete(id: string): Promise<void> {
    return ColosUserRepository.delete(id)
  },
}
