import { PlanService } from "@/app/api/modules/plans/plans.service"

export async function GET() {
    try {
      const plans = await PlanService.getAllExternal()
      return Response.json(plans)
    } catch (error: any) {
      console.error("External plans error:", error)
      return Response.json(
        { message: error.message ?? "Failed to fetch plans" },
        { status: 500 }
      )
    }
  }