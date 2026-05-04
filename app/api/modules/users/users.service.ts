import { UserRepository } from "./users.repository"
import type { CreateUserInput, UpdateUserInput } from "./users.validation"
import type { User } from "./users.type"
import { hashPassword } from "@/lib/password"
import { adminClient } from "@/utils/supabase/admin"

function generatePassword(fullname: string): string {
  return fullname.trim().split(/\s+/).join("")
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
    const plainPassword = generatePassword(input.fullname)

    const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: input.email,
      password: plainPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user")
    }

    const hashedPassword = await hashPassword(plainPassword)
    return UserRepository.create({
      ...input,
      id: authData.user.id,
      password: hashedPassword,
      created_at: new Date().toISOString().split("T")[0],
      is_active: true,
      first_login_executed: false,
    })
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    await UserService.getById(id)
    return UserRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    return UserRepository.delete(id)
  },
}
