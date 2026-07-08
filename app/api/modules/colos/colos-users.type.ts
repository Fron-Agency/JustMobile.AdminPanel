export type ColosUserRole = "ADMIN" | "USER"

export type ColosUserDto = {
  id: string
  email: string
  name: string | null
  role: ColosUserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateColosUserDto = {
  email: string
  name?: string | null
  role: ColosUserRole
  passwordHash: string
}

export type UpdateColosUserDto = Partial<{
  email: string
  name: string | null
  role: ColosUserRole
  isActive: boolean
  passwordHash: string
}>
