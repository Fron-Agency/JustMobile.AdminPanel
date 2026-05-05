import { z } from "zod"

export const createLeadSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),

  phone: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),

  plan_id: z.string().min(1, "Plan is required"),

  file_url: z
    .string()
    .nullable()
    .optional()
    .default(null),

  status: z.enum(["new", "contacted", "converted", "lost"]).default("new"),

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
  }),
})

export const updateLeadSchema = createLeadSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>