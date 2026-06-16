import { z } from "zod"

export const createLimitedOffers = z.object({
  plan_mobile_id: z.string().min(1, "Provider is required"),
  email: z.string().min(1, "Email is required"),
})

export type CreateLimitedOffers = z.infer<typeof createLimitedOffers>