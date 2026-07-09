import { renderToBuffer } from "@react-pdf/renderer"
import { put, get } from "@vercel/blob"
import { ColosQuoteService } from "./colos-quotes.service"
import { LeadPdfRepository } from "./lead-pdf.repository"
import { ColosMandatePdf } from "./colos-pdf.template"

export const ColosPdfService = {
  async generateAndStore(quoteId: number) {
    const quote = await ColosQuoteService.getById(quoteId)

    const buffer = await renderToBuffer(ColosMandatePdf({ quote }))
    const pathname = `quote-${quoteId}.pdf`

    await put(pathname, buffer, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return LeadPdfRepository.upsert(quoteId, pathname)
  },

  async getFile(quoteId: number) {
    const record = await LeadPdfRepository.findByQuoteId(quoteId)
    if (!record) return null

    const result = await get(record.pdfUrl, { access: "private" })
    if (!result) return null

    return result
  },

  async getBuffer(quoteId: number) {
    const file = await this.getFile(quoteId)
    if (!file?.stream) return null

    const arrayBuffer = await new Response(file.stream).arrayBuffer()
    return Buffer.from(arrayBuffer)
  },
}
