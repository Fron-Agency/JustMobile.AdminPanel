export type CandidateStatus = "new" | "reviewed" | "accepted" | "rejected"

// Mirrors OptimusMarketing's careers application form (lib/careers/application.ts).
export const CANDIDATE_LANGUAGES = [
  "german",
  "french",
  "italian",
  "serboCroatian",
  "turkish",
  "spanish",
  "english",
] as const

export type CandidateLanguage = (typeof CANDIDATE_LANGUAGES)[number]

export const CEFR_LEVELS = ["B1", "B2", "C1", "C2"] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

export const CANDIDATE_LANGUAGE_LABELS: Record<CandidateLanguage, string> = {
  german: "German",
  french: "French",
  italian: "Italian",
  serboCroatian: "Serbian/Croatian",
  turkish: "Turkish",
  spanish: "Spanish",
  english: "English",
}

export interface Candidates {
  id: string
  firstname: string
  lastname: string
  date_of_birth: string
  phone_number: string
  city: string
  email: string
  /** One selected level per language the applicant checked, e.g. { german: "C1" }. */
  languages: Partial<Record<CandidateLanguage, CefrLevel>>
  previous_role: string
  why_us: string
  created_at: string
  status: CandidateStatus
}

export interface UpdateCandidateStatusDto {
  status: CandidateStatus
}
