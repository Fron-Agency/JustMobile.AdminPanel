import { z } from "zod"

export const createLeadSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required"),
  phone: z.string().min(1, "Phone is required"),
  plan_id: z.string().min(1, "Plan is required"),
  file_url: z.string().nullable().optional(),
  status: z.enum(["new", "contacted", "converted", "lost"]).default("new"),
})

export const updateLeadSchema = createLeadSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
