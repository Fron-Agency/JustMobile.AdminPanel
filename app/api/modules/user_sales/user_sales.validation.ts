import { z } from "zod"

// No `sales` field on create: every new sales agent starts at 0
// (set in UserSalesService.create). Unknown keys are stripped by zod.
export const createUserSalesSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
})

export type CreateUserSalesInput = z.infer<typeof createUserSalesSchema>

export const updateUserSalesSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required").max(100).optional(),
    last_name: z.string().trim().min(1, "Last name is required").max(100).optional(),
    sales: z.number().finite().min(0, "Sales cannot be negative").optional(),
  })
  .refine(
    (data) => data.first_name !== undefined || data.last_name !== undefined || data.sales !== undefined,
    { message: "Provide at least one of first_name, last_name, or sales." }
  )

export type UpdateUserSalesInput = z.infer<typeof updateUserSalesSchema>
