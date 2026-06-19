import { NextRequest, NextResponse } from "next/server"
import { LimitedOffersService } from "../modules/limited_offers/limited_offers.service"

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