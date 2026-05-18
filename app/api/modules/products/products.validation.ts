import { z } from "zod"

export const createProductSchema = z.object({
  plan_mobile_id: z.string().uuid().nullable().optional(),
  plan_home_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string().nullable().optional(),
  base_price: z.number().min(0, "Base price must be >= 0"),
  is_active: z.boolean(),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createColorSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  hex_code: z.string().min(1, "Hex code is required"),
  is_active: z.boolean(),
})

export const updateColorSchema = createColorSchema.partial()

export type CreateColorInput = z.infer<typeof createColorSchema>
export type UpdateColorInput = z.infer<typeof updateColorSchema>

export const createPhotoSchema = z.object({
  color_id: z.string().uuid("Invalid color ID"),
  file_url: z.string().min(1, "File URL is required"),
  is_primary: z.boolean(),
  sort_order: z.number().int().min(0),
})

export const updatePhotoSchema = createPhotoSchema.partial()

export type CreatePhotoInput = z.infer<typeof createPhotoSchema>
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>
