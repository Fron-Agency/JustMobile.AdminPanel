import { NextRequest, NextResponse } from "next/server"
import { LimitedOffersService } from "../modules/limited_offers/limited_offers.service"
import { createLimitedOffers } from "../modules/limited_offers/limited_offers.validation"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const offers = await LimitedOffersService.findAll(
    startDate,
    endDate
  )

  return NextResponse.json(offers)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createLimitedOffers.parse(body)
    const lead = await LimitedOffersService.create(parsed)
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}