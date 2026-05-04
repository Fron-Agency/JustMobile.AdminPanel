import { NextResponse } from "next/server"
import { PlanService } from "@/app/api/modules/plans/plans.service"
import { z } from "zod"

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
      { message: error instanceof Error ? error.message : "Failed to update plan favorite" },
      { status: 400 }
    )
  }
}