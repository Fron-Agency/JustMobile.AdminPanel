import { z } from "zod"

const featureSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

const jsonBlockSchema = z.object({
  title: z.string().min(1),
  features: z.array(featureSchema),
}).nullable().optional()

export const createPlanHomeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  provider_id: z.string().uuid("Provider is required"),
  price: z.number().positive("Price must be greater than 0"),
  discount_price: z.number().nullable().optional(),
  without_mobile_price: z.number().nullable().optional(),
  contract_duration: z.string().nullable().optional(),
  internet_content: jsonBlockSchema,
  tv: jsonBlockSchema,
  telephony: jsonBlockSchema,
  other: jsonBlockSchema
})

export const updatePlanHomeSchema = createPlanHomeSchema.partial()

export type CreatePlanHomeInput = z.infer<typeof createPlanHomeSchema>
export type UpdatePlanHomeInput = z.infer<typeof updatePlanHomeSchema>
