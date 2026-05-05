import { z } from "zod"

export const createLeadSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  plan_id: z.string().min(1, "Plan is required"),
  file_url: z.string().nullable().optional(),
  status: z.enum(["new", "contacted", "converted", "lost"]).default("new"),

  date_of_birth: z.string().nullable().optional(),
  swiss_number: z.boolean().nullable().optional(),
  keep_swiss_number: z.boolean().nullable().optional(),
  roaming_control: z.boolean().nullable().optional(),
  child_date_of_birth: z.string().nullable().optional(),

  address: z.object({
    zip_code: z.string().min(1, "Zip code is required"),
    city: z.string().min(1, "City is required"),
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
  }),
})

export const updateLeadSchema = createLeadSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>