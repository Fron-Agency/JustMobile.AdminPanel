import { z } from "zod"

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  file_url: z.string().nullable().optional(),
})

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>
export type UpdatePartnerInput = z.infer<typeof createPartnerSchema>