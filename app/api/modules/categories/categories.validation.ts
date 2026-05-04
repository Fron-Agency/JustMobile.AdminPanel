import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  badge: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = Partial<CreateCategoryInput>