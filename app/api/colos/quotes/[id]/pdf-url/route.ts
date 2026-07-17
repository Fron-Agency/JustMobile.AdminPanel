import { NextResponse } from "next/server"
import { ColosPdfService } from "@/app/api/modules/colos/colos-pdf.service"
import { COLOS_PDF_LANGUAGES, type ColosPdfLang } from "@/app/api/modules/colos/colos-pdf.languages"
import { requireColosAuth } from "@/utils/colos/require-auth"

const VALID_LANGS = new Set(COLOS_PDF_LANGUAGES.map((l) => l.code))

function parseLang(value: string | null): ColosPdfLang {
  return value && VALID_LANGS.has(value as ColosPdfLang) ? (value as ColosPdfLang) : "fr"
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const lang = parseLang(new URL(req.url).searchParams.get("lang"))
    const buffer = await ColosPdfService.renderForViewing(Number(id), lang)

    return new NextResponse(buffer, {
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
