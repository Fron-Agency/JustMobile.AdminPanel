import { QuoteRepository } from "./quotes.repository"
import type { Quote, QuoteSource } from "./quotes.type"

export const QuoteService = {
  async getAllBySource(source: QuoteSource): Promise<Quote[]> {
    return QuoteRepository.findAllBySource(source)
  },

  async getById(id: number): Promise<Quote> {
    const quote = await QuoteRepository.findById(id)
    if (!quote) throw new Error("Quote not found")
    return quote
  },
}
