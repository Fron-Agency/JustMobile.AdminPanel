import { ColosQuoteRepository } from "./colos-quotes.repository"
import type { ColosQuote } from "./colos-quotes.type"

export const ColosQuoteService = {
  async getAll(): Promise<ColosQuote[]> {
    return ColosQuoteRepository.findAll()
  },

  async getById(id: number): Promise<ColosQuote> {
    const quote = await ColosQuoteRepository.findById(id)
    if (!quote) throw new Error("Quote not found")
    return quote
  },
}
