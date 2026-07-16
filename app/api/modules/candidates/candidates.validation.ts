import { z } from "zod"
import { CANDIDATE_LANGUAGES, CANDIDATE_STATUSES, CEFR_LEVELS } from "./candidates.types"

export const updateCandidateSchema = z
  .object({
    status: z.enum(CANDIDATE_STATUSES).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    // ISO timestamp (e.g. from <input type="datetime-local">), null clears it.
    interview_date: z.string().trim().min(1).nullable().optional(),
    is_favorite: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.notes !== undefined ||
      data.interview_date !== undefined ||
      data.is_favorite !== undefined,
    {
      message: "Provide at least one of status, notes, interview_date, or is_favorite.",
    }
  )

export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>

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

// Bulk CSV import: source spreadsheets are years of manually-maintained recruiting
// data with inconsistent formats, so this is deliberately looser than
// createCandidateSchema (empty date_of_birth / why_us / previous_role allowed,
// email format still enforced since it's how we dedupe rows).
export const importCandidateSchema = z.object({
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  date_of_birth: z.string().trim().default(""),
  phone_number: z.string().trim().default(""),
  city: z.string().trim().default(""),
  email: z.string().trim().email(),
  languages: z.record(z.enum(CANDIDATE_LANGUAGES), z.enum(CEFR_LEVELS)).default({}),
  previous_role: z.string().trim().max(200).default(""),
  why_us: z.string().trim().max(5000).default(""),
  status: z.enum(CANDIDATE_STATUSES).default("new"),
  // ISO date (YYYY-MM-DD), from the CSV's Timestamp column — lets imported rows
  // show their real application date instead of the import moment. Omitted/empty
  // falls back to the DB column default (today) via CandidatesRepository.bulkInsert.
  created_at: z.string().trim().optional(),
})

export type ImportCandidateInput = z.infer<typeof importCandidateSchema>

export const importCandidatesRequestSchema = z.object({
  rows: z.array(importCandidateSchema).min(1).max(2000),
})
