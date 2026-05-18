import { NextResponse } from "next/server"
import { z } from "zod"
import { PlanService } from "../modules/plans_mobile/plans_mobile.service"
import { createPlanMobileSchema } from "../modules/plans_mobile/plans_mobile.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const plans = await PlanService.getAll()
  return Response.json(plans)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { country_zones, ...rest } = body
    const parsed = createPlanMobileSchema.parse(rest)
    const zones = Array.isArray(country_zones) ? country_zones : []
    const plan = await PlanService.create(parsed, zones)
    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}

const updateFavoriteSchema = z.object({
  is_favorite: z.boolean(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = updateFavoriteSchema.parse(await req.json())
    const updated = await PlanService.update(id, { is_favorite: body.is_favorite })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 400 }
    )
  }
}
