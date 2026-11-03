import { z } from "zod"

// An empty string means "no team"; an absent key stays undefined so partial
// updates don't clear the column.
const emptyToNull = (v: string | null | undefined) => (v === "" ? null : v)

const firstName = z.string().trim().min(1, "First name is required").max(100)
const lastName = z.string().trim().min(1, "Last name is required").max(100)
export const team = z.string().trim().max(50).nullable().optional().transform(emptyToNull)

export const createAgentSchema = z.object({
  first_name: firstName,
  last_name: lastName,
  team,
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>

export const updateAgentSchema = z
  .object({
    first_name: firstName.optional(),
    last_name: lastName.optional(),
    team,
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Provide at least one of first_name, last_name, or team.",
  })

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
