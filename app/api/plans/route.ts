import { NextResponse } from "next/server"
import { z } from "zod"
import { PlanService } from "../modules/plans/plans.service"
import { createPlanSchema } from "../modules/plans/plans.validation"

export async function GET() {
  const plans = await PlanService.getAll()
  return Response.json(plans)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createPlanSchema.parse(body)

    const plan = await PlanService.create(parsed)

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