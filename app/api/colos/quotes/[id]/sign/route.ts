import { NextResponse } from "next/server"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { requireColosAuth } from "@/utils/colos/require-auth"

const DATA_URL_PREFIX = /^data:image\/png;base64,/

function decodePngDataUrl(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== "string" || !DATA_URL_PREFIX.test(dataUrl)) return null
  const base64 = dataUrl.replace(DATA_URL_PREFIX, "")
  if (!base64) return null
  try {
    return Buffer.from(base64, "base64")
  } catch {
    return null
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const quoteId = Number(id)

    const body = await req.json().catch(() => null)
    const clientSignaturePng = decodePngDataUrl(body?.clientSignature)
    const workerSignaturePng = decodePngDataUrl(body?.workerSignature)

    if (!clientSignaturePng || !workerSignaturePng) {
      return NextResponse.json(
        { message: "Both client and worker signatures are required." },
        { status: 400 }
      )
    }

    const record = await ColosPdfService.regenerateWithSignatures(quoteId, {
      clientSignaturePng,
      workerSignaturePng,
    })

    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save signatures" },
      { status: 500 }
    )
  }
}
