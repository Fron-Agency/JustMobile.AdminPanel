import { z } from "zod"

const firstName = z.string().trim().min(1, "First name is required").max(100)
const lastName = z.string().trim().min(1, "Last name is required").max(100)

export const createAgentSchema = z.object({
  first_name: firstName,
  last_name: lastName,
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>

export const updateAgentSchema = z
  .object({
    first_name: firstName.optional(),
    last_name: lastName.optional(),
  })
  .refine((data) => data.first_name !== undefined || data.last_name !== undefined, {
    message: "Provide at least one of first_name or last_name.",
  })

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
