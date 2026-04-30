import { z } from "zod"

export const createProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Category is required"),
})

export const updateProviderSchema = createProviderSchema.partial().extend({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Category is required"),
  is_active: z.boolean().optional(),
})

export type CreateProviderInput = z.infer<typeof createProviderSchema>
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>