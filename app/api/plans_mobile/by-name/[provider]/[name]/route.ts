import { PlanService } from "@/app/api/modules/plans_mobile/plans_mobile.service"

export async function GET(request: Request, { params }: { params: Promise<{ provider: string, name: string }> }) {
  try {
    const { provider, name } = await params
    const plan = await PlanService.getPlanMobileByName(provider, name)

    if (!plan) {
      return Response.json(
        { message: "Plan not found" },
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