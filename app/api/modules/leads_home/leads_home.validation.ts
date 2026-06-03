import { z } from "zod"

export const createLeadHomeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastname: z.string().min(1, "Lastname is required"),
  mobile_number: z.string().optional().nullable().default(null),
  date_of_birth: z.coerce.date().transform((d) => d.toISOString().split("T")[0]),
  nationality: z.string().min(1, "Nationality is required"),
  document_type: z.string().min(1, "Document type is required"),
  document_number: z.string().min(1, "Document number is rqeuired"),
  plan_home_id: z.string(),
  oto_number: z.string().optional().nullable().default(null),
  email: z.string().email("Invalid email"),
  arriving_date: z.coerce.date().transform((d) => d.toISOString().split("T")[0]).optional().nullable().default(null),
  landline_number: z.string().optional().nullable().default(null),
  swiss_number: z.boolean(),
  provider_name: z.string().optional().nullable().default(null),
  oto_provider: z.string().optional().nullable().default(null),
  comment: z.string().optional().nullable().default(null),
  address: z.object({
    zip_code: z.string().min(1, "Zip code is required"),
    city: z.string().min(1, "City is required"),
    street: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    number: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
  }),
  status: z.enum(["new", "sent", "contacted", "converted", "lost"]).default("new"),
  oto_expiry_date: z.coerce.date().transform((d) => d.toISOString().split("T")[0]).optional().nullable().default(null),
})

export const updateLeadHomeSchema = createLeadHomeSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadHomeSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadHomeSchema>