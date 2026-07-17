export const CANDIDATE_STATUSES = [
  "new",
  "initialContact",
  "phoneInterviewScheduled",
  "phoneInterviewConducted",
  "inPersonInterviewScheduled",
  "inPersonInterviewConducted",
  "trialShiftScheduled",
  "trialShiftCompleted",
  "offerSent",
  "accepted",
  "rejected",
  "noResponse",
  "talentPool",
] as const

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

// Tailwind classes per status, used for badges and filter pills.
// Colors loosely follow the recruiting pipeline's traffic-light convention.
export const CANDIDATE_STATUS_COLORS: Record<CandidateStatus, string> = {
  new: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
  initialContact: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
  phoneInterviewScheduled: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30",
  phoneInterviewConducted: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
  inPersonInterviewScheduled: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
  inPersonInterviewConducted: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
  trialShiftScheduled: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
  trialShiftCompleted: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
  offerSent: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  accepted: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
  noResponse: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30",
  talentPool: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/30",
}

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
  notes: string | null
  /** ISO timestamp (timestamptz) of the scheduled interview, or null if unscheduled. */
  interview_date: string | null
  is_favorite: boolean | null
  /** Google Calendar event id backing interview_date, or null if unsynced/unscheduled. */
  google_event_id: string | null
}

export interface UpdateCandidateDto {
  status?: CandidateStatus
  notes?: string | null
  interview_date?: string | null
  is_favorite?: boolean
  google_event_id?: string | null
}
