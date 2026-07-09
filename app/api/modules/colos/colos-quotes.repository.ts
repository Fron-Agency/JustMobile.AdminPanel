import { colosPrisma } from "@/lib/colos-prisma"
import type { ColosQuote } from "./colos-quotes.type"

export const ColosQuoteRepository = {
  async findAll(): Promise<ColosQuote[]> {
    return colosPrisma.quote.findMany({ orderBy: { createdAt: "desc" } })
  },

  async findById(id: number): Promise<ColosQuote | null> {
    return colosPrisma.quote.findUnique({ where: { id } })
  },
}
