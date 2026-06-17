import { LimitedOffersService } from "../../../modules/limited_offers/limited_offers.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string; plan_id: string }> }
) {
  try {
    const { email, plan_id } = await params

    const offer = await LimitedOffersService.getByEmail(email, plan_id)

    if (!offer) {
      return Response.json(
        { message: "Offer not found" },
        { status: 404 }
      )
    }

    return Response.json(offer)
  } catch (error: any) {
    console.error("Offer error:", error)

    return Response.json(
      { message: error.message ?? "Failed to fetch offer" },
      { status: 500 }
    )
  }
}