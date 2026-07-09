import { z } from "zod"

export const updateCandidateStatusSchema = z.object({
  status: z.enum(["new", "reviewed", "accepted", "rejected"]),
})

export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>
