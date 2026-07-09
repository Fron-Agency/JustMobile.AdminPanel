import { prisma } from "@/lib/prisma"
import type { Quote } from "./quotes.type"

export const QuoteRepository = {
  async findAllBySource(): Promise<Quote[]> {
    return prisma.quote.findMany({ orderBy: { createdAt: "desc" } })
  },

  async findById(id: number): Promise<Quote | null> {
    return prisma.quote.findUnique({ where: { id } })
  },
}
