import { NextResponse } from "next/server"
import { z } from "zod"
import { PlanService } from "../modules/plans/plans.service"

const updatePlanSchema = z.object({
  is_favorite: z.boolean(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params  
    const body = updatePlanSchema.parse(await req.json())
    const updated = await PlanService.update(id, { is_favorite: body.is_favorite })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 400 }
    )
  }
}