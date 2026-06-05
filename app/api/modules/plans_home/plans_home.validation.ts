import { z } from "zod"

const featureSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const jsonBlockSchema = z.object({
  title: z.string(),
  features: z.array(featureSchema),
})

const localizedBlockSchema = z.object({
  en: jsonBlockSchema.optional(),
  de: jsonBlockSchema.optional(),
  fr: jsonBlockSchema.optional(),
  it: jsonBlockSchema.optional(),
})

const contentBlockSchema = z.union([jsonBlockSchema, localizedBlockSchema]).nullable().optional()

export const createPlanHomeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider_id: z.string().uuid("Provider is required"),
  price: z.number().positive("Price must be greater than 0"),
  discount_price: z.number().nullable().optional(),
  without_mobile_price: z.number().nullable().optional(),
  contract_duration: z.string().nullable().optional(),
  internet_content: contentBlockSchema,
  tv: contentBlockSchema,
  telephony: contentBlockSchema,
  other: contentBlockSchema
})

export const updatePlanHomeSchema = createPlanHomeSchema.partial()

export type CreatePlanHomeInput = z.infer<typeof createPlanHomeSchema>
export type UpdatePlanHomeInput = z.infer<typeof updatePlanHomeSchema>
