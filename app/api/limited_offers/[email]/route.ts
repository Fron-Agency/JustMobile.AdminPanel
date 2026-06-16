import { LimitedOffersService } from "../../modules/limited_offers/limited_offers.service"

export async function GET(request: Request, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params
    const plan = await LimitedOffersService.getByEmail(email)

    if (!plan) {
      return Response.json(
        { message: "Email not found" },
        { status: 404 }
      )
    }

    return Response.json(plan)
  } catch (error: any) {
    console.error("Plan error:", error)

    return Response.json(
      { message: error.message ?? "Failed to fetch plan" },
      { status: 500 }
    )
  }
}