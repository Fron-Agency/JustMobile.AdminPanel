import { prisma } from "@/lib/prisma"
import type { Quote, QuoteSource } from "./quotes.type"

export const QuoteRepository = {
  async findAllBySource(source: QuoteSource): Promise<Quote[]> {
    return prisma.quote.findMany({ where: { source }, orderBy: { createdAt: "desc" } })
  },

  async findById(id: number): Promise<Quote | null> {
    return prisma.quote.findUnique({ where: { id } })
  },
}
