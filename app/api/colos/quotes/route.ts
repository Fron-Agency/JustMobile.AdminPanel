import { NextResponse } from "next/server"
import { colosPrisma } from "@/lib/colos-prisma"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function GET() {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const quotes = await colosPrisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { pdf: true },
    })

    const withPdf = quotes.map(({ pdf, ...quote }) => ({
      ...quote,
      pdfUrl: pdf?.pdfUrl ?? null,
      pdfGeneratedAt: pdf?.pdfGeneratedAt ?? null,
    }))

    return Response.json(withPdf)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch quotes" },
      { status: 500 }
    )
  }
}
