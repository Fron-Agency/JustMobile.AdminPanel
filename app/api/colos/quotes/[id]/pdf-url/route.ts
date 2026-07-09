import { NextResponse } from "next/server"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const file = await ColosPdfService.getFile(Number(id))
    if (!file) {
      return NextResponse.json({ message: "No PDF generated yet" }, { status: 404 })
    }

    return new NextResponse(file.stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="quote-${id}.pdf"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get PDF" },
      { status: 500 }
    )
  }
}
