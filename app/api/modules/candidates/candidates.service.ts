import { CandidatesRepository } from "./candidates.repository"
import type { UpdateCandidateStatusInput } from "./candidates.validation"
import type { Candidates } from "./candidates.types"

export const CandidatesService = {
  async getAll(): Promise<Candidates[]> {
    return CandidatesRepository.findAll()
  },

  async getById(id: string): Promise<Candidates> {
    const candidate = await CandidatesRepository.findById(id)
    if (!candidate) throw new Error("Candidate not found")
    return candidate
  },

  async updateStatus(id: string, input: UpdateCandidateStatusInput): Promise<Candidates> {
    await CandidatesService.getById(id)
    return CandidatesRepository.updateStatus(id, input)
  },

  async delete(id: string): Promise<void> {
    await CandidatesService.getById(id)
    return CandidatesRepository.delete(id)
  },
}
