import { QuoteRepository } from "./quotes.repository"
import type { Quote } from "./quotes.type"

export const QuoteService = {
  async getAllBySource(): Promise<Quote[]> {
    return QuoteRepository.findAllBySource()
  },

  async getById(id: number): Promise<Quote> {
    const quote = await QuoteRepository.findById(id)
    if (!quote) throw new Error("Quote not found")
    return quote
  },
}
