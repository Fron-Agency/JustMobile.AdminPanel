export type User = {
  id: string
  fullname: string
  email: string
  role: "admin" | "agent" | "viewer"
  created_at: string
  is_active: boolean
  first_login_executed: boolean
}

export type CreateUserDto = {
  fullname: string
  email: string
  role: string
  password: string
  created_at: string
  is_active: boolean
  first_login_executed: boolean
}

export type UpdateUserDto = Partial<CreateUserDto>