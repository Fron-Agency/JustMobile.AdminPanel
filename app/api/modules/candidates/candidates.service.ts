import { CandidatesRepository } from "./candidates.repository"
import type { CreateCandidateInput, ImportCandidateInput, UpdateCandidateInput } from "./candidates.validation"
import type { Candidates, UpdateCandidateDto } from "./candidates.types"
import { upsertInterviewEvent, deleteInterviewEvent } from "@/lib/google-calendar"

export interface ImportCandidatesResult {
  imported: number
  failed: Array<{ row: number; email: string; error: string }>
}

const IMPORT_CHUNK_SIZE = 100

export const CandidatesService = {
  async create(input: CreateCandidateInput): Promise<Candidates> {
    return CandidatesRepository.create(input)
  },

  // Batch insert with per-chunk fallback to per-row insert: a single malformed
  // row (or a rare 500-item batch hitting a DB limit) shouldn't sink the whole
  // CSV import — every other valid row should still land.
  async importCandidates(rows: ImportCandidateInput[]): Promise<ImportCandidatesResult> {
    const result: ImportCandidatesResult = { imported: 0, failed: [] }

    for (let start = 0; start < rows.length; start += IMPORT_CHUNK_SIZE) {
      const chunk = rows.slice(start, start + IMPORT_CHUNK_SIZE)
      try {
        const inserted = await CandidatesRepository.bulkInsert(chunk)
        result.imported += inserted.length
      } catch {
        // Chunk failed as a whole — retry row by row so we can pinpoint which ones broke.
        for (let i = 0; i < chunk.length; i++) {
          try {
            await CandidatesRepository.bulkInsert([chunk[i]])
            result.imported += 1
          } catch (rowErr) {
            result.failed.push({
              row: start + i,
              email: chunk[i].email,
              error: rowErr instanceof Error ? rowErr.message : "Insert failed",
            })
          }
        }
      }
    }

    return result
  },

  async getAll(): Promise<Candidates[]> {
    return CandidatesRepository.findAll()
  },

  async getById(id: string): Promise<Candidates> {
    const candidate = await CandidatesRepository.findById(id)
    if (!candidate) throw new Error("Candidate not found")
    return candidate
  },

  async update(id: string, input: UpdateCandidateInput): Promise<Candidates> {
    const existing = await CandidatesService.getById(id)

    const payload: UpdateCandidateDto = { ...input }

    if (input.interview_date !== undefined && input.interview_date !== existing.interview_date) {
      if (input.interview_date) {
        payload.google_event_id = await upsertInterviewEvent({
          eventId: existing.google_event_id,
          candidateName: `${existing.firstname} ${existing.lastname}`,
          interviewDate: input.interview_date,
        })
      } else if (existing.google_event_id) {
        await deleteInterviewEvent(existing.google_event_id)
        payload.google_event_id = null
      }
    }

    return CandidatesRepository.update(id, payload)
  },

  async delete(id: string): Promise<void> {
    const existing = await CandidatesService.getById(id)
    if (existing.google_event_id) {
      await deleteInterviewEvent(existing.google_event_id)
    }
    return CandidatesRepository.delete(id)
  },
}
