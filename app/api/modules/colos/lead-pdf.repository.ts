import { colosPrisma } from "@/lib/colos-prisma"
import type { LeadPdf } from "@/app/generated/colos"

export const LeadPdfRepository = {
  async findByQuoteId(quoteId: number): Promise<LeadPdf | null> {
    return colosPrisma.leadPdf.findUnique({ where: { quoteId } })
  },

  async findByQuoteIds(quoteIds: number[]): Promise<LeadPdf[]> {
    if (quoteIds.length === 0) return []
    return colosPrisma.leadPdf.findMany({ where: { quoteId: { in: quoteIds } } })
  },

  async findAll(): Promise<LeadPdf[]> {
    return colosPrisma.leadPdf.findMany({ orderBy: { pdfGeneratedAt: "desc" } })
  },

  async upsert(quoteId: number, pdfUrl: string): Promise<LeadPdf> {
    return colosPrisma.leadPdf.upsert({
      where: { quoteId },
      create: { quoteId, pdfUrl },
      update: { pdfUrl, pdfGeneratedAt: new Date() },
    })
  },
}
