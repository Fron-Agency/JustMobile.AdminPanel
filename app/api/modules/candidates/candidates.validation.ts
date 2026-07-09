import { z } from "zod"
import { CANDIDATE_LANGUAGES, CEFR_LEVELS } from "./candidates.types"

export const updateCandidateStatusSchema = z.object({
  status: z.enum(["new", "reviewed", "accepted", "rejected"]),
})

export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>

export const createCandidateSchema = z.object({
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  date_of_birth: z.string().trim().min(1), // ISO date (YYYY-MM-DD)
  phone_number: z.string().trim().min(1),
  city: z.string().trim().min(1),
  email: z.string().trim().email(),
  languages: z.record(z.enum(CANDIDATE_LANGUAGES), z.enum(CEFR_LEVELS)),
  previous_role: z.string().trim().max(200),
  why_us: z.string().trim().min(1).max(5000),
})

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>
