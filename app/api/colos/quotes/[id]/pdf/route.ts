import { NextResponse } from "next/server"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { LeadPdfRepository } from "@/app/api/modules/colos/lead-pdf.repository"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const quoteId = Number(id)

    const existing = await LeadPdfRepository.findByQuoteId(quoteId)
    if (existing?.signedAt) {
      return NextResponse.json(
        { message: "This mandate has already been signed and cannot be regenerated." },
        { status: 409 }
      )
    }

    const record = await ColosPdfService.generateAndStore(quoteId)
    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
