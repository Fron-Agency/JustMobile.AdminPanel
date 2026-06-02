import { z } from "zod"

export const createPlanMobileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider_id: z.string().min(1, "Provider is required"),
  price: z.number().min(1, "Price is required"),
  data_gb: z.number().optional().nullable().default(null),
  network_technology: z.string().min(1, "Network technology is required"),
  contract_length: z.number().optional().nullable().default(null),
  is_favorite: z.boolean().optional(),
  discount: z.number().optional().nullable().default(null),
  data_gb_europe: z.number().optional().nullable().default(null),
  product_price: z.number().optional().nullable().default(null)
})

export const updatePlanMobileSchema = createPlanMobileSchema.partial().extend({
  is_favorite: z.boolean().optional(),
})

export type CreatePlanMobileInput = z.infer<typeof createPlanMobileSchema>
export type UpdatePlanMobileInput = z.infer<typeof updatePlanMobileSchema>