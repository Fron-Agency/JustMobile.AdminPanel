import { z } from "zod"

export const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider_id: z.string().min(1, "Provider is required"),
  price: z.number().min(1, "Price is required"),
  data_gb: z.number().min(1, "Data is required"),
  speed: z.number().min(1, "Speed is required"),
  contract_length: z.number().min(1, "Contract length is required"),
  discount: z.number().min(1, "Discount is required"),
  is_favorite: z.boolean().optional(),
})

export const updatePlanSchema = createPlanSchema.partial().extend({
  is_favorite: z.boolean().optional(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>