import { z } from "zod"

export const createLeadSchema = z.object({
  fullname: z.string().nullable().optional(),
  email: z.string().email("Invalid email"),

  phone: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),

  plan_id: z.string().nullable().optional(),

  status: z.enum(["new", "sent", "contacted", "converted", "lost"]).default("new"),

  date_of_birth: z
    .string()
    .nullable()
    .optional()
    .default(null),

  swiss_number: z
    .boolean()
    .nullable()
    .optional()
    .default(null),

  keep_swiss_number: z
    .boolean()
    .nullable()
    .optional()
    .default(null),

  roaming_control: z
    .boolean()
    .nullable()
    .optional()
    .default(null),

  child_date_of_birth: z
    .string()
    .nullable()
    .optional()
    .default(null),

  is_child_order: z.boolean().default(false),

  description: z
    .string()
    .nullable()
    .optional()
    .default(null),

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
  }).optional(),

  documents: z.array(z.string()).optional().default([]),

  product_color_id: z.string().nullable().optional().default(null),
  referred_by_lead_id: z.string().nullable().optional().default(null),
  applied_referral_code: z.string().nullable().optional().default(null),

})

export const updateLeadSchema = createLeadSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>