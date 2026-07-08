import { NextResponse } from "next/server"
import { QuoteService } from "@/app/api/modules/quotes/quotes.service"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function GET() {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const quotes = await QuoteService.getAllBySource("colos")
    return Response.json(quotes)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch quotes" },
      { status: 500 }
    )
  }
}
