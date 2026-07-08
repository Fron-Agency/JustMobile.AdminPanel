import { z } from "zod"

export const createColosUserSchema = z.object({
  name: z.string().min(1, "Full name is required").optional(),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.enum(["ADMIN", "USER"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const updateColosUserSchema = z.object({
  name: z.string().min(1, "Full name is required").optional(),
  email: z.string().min(1, "Email is required").email("Invalid email address").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
})

export type CreateColosUserInput = z.infer<typeof createColosUserSchema>
export type UpdateColosUserInput = z.infer<typeof updateColosUserSchema>
