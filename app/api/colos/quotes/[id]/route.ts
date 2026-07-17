import { NextResponse } from "next/server"
import { colosPrisma } from "@/lib/colos-prisma"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const quote = await colosPrisma.quote.findUnique({
      where: { id: Number(id) },
      include: { pdf: true },
    })

    if (!quote) {
      return NextResponse.json({ message: "Quote not found" }, { status: 404 })
    }

    const { pdf, ...rest } = quote
    return NextResponse.json({
      ...rest,
      pdfUrl: pdf?.pdfUrl ?? null,
      pdfGeneratedAt: pdf?.pdfGeneratedAt ?? null,
      signedAt: pdf?.signedAt ?? null,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch quote" },
      { status: 500 }
    )
  }
}
