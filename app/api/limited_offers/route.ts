import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"
import { createLimitedOffers } from "../modules/limited_offers/limited_offers.validation"
import { LimitedOffersService } from "../modules/limited_offers/limited_offers.service"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const leads = await LimitedOffersService.get()
    return Response.json(leads)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
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