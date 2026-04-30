import { z } from "zod"

export const createUserSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  role: z.string().min(1, "Role is required").refine((val) => ["admin", "agent", "viewer"].includes(val), {
    message: "Role must be one of: admin, agent, viewer",
  }),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(1, "Password is required").optional(),
  is_active: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>