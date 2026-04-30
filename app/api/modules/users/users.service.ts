import { UserRepository } from "./users.repository"
import type { CreateUserInput, UpdateUserInput } from "./users.validation"
import type { User } from "./users.type"

function generatePassword(fullname: string) {
  const parts = fullname.trim().split(/\s+/)
  const firstName = parts[0] ?? ""
  const rest = parts.slice(1).join("")
  const firstPart = firstName.slice(0, 4)
  return `${firstPart}${rest}`
}

export const UserService = {
  async getAll(): Promise<User[]> {
    return UserRepository.findAll()
  },

  async getById(id: string): Promise<User> {
    const user = await UserRepository.findById(id)
    if (!user) throw new Error("User not found")
    return user
  },

  async create(input: CreateUserInput): Promise<User> {
    return UserRepository.create({
      ...input,
      password: generatePassword(input.fullname),
      created_at: new Date().toISOString().split("T")[0],
      is_active: true,
    })
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    await UserService.getById(id)
    return UserRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    // await UserService.getById(id)
    return UserRepository.delete(id)
  },
}