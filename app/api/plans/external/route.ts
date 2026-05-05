import { PlanService } from "@/app/api/modules/plans/plans.service"

export async function GET() {
  const plans = await PlanService.getAllExternal()
  return Response.json(plans)
}