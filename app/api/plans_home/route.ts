import { NextResponse } from "next/server"
import { PlanHomeService } from "@/app/api/modules/plans_home/plans_home.service"
import { createPlanHomeSchema } from "@/app/api/modules/plans_home/plans_home.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  try {
    const plans = await PlanHomeService.getAll()
    return Response.json(plans)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createPlanHomeSchema.parse(body)
    const plan = await PlanHomeService.create(parsed)
    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
