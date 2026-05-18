import { z } from "zod"

export const createCountrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  countries: z.array(z.string()).nullable().optional(),
})

export const updateCountrySchema = createCountrySchema.partial()

export type CreateCountryInput = z.infer<typeof createCountrySchema>
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>
