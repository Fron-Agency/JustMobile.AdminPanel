import { z } from "zod"

export const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider_id: z.string().min(1, "Provider is required"),
  price: z.number().min(1, "Price is required"),
  // data_gb: z.number().min(1, "Data is required"),
  network_technology: z.string().min(1, "Network technology is required"),
  is_favorite: z.boolean().optional(),
  countries: z.array(z.string()).min(1),
})

export type CreatePlanInput = {
  name: string
  provider_id: string
  price: number
  data_gb: number
  network_technology: string
  is_favorite?: boolean
  countries: string[]
}

export const updatePlanSchema = createPlanSchema.partial().extend({
  is_favorite: z.boolean().optional(),
})

// export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>