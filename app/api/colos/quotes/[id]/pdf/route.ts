import { NextResponse } from "next/server"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const record = await ColosPdfService.generateAndStore(Number(id))
    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
