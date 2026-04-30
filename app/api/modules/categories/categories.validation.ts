import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  is_active: z.boolean().default(true),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = Partial<CreateCategoryInput>