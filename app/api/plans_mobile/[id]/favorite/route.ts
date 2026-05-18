import { NextResponse } from "next/server"
import { PlanService } from "@/app/api/modules/plans_mobile/plans_mobile.service"
import { requireAuth } from "@/utils/supabase/require-auth"
import { z } from "zod"

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
      { message: error instanceof Error ? error.message : "Failed to update plan favorite" },
      { status: 400 }
    )
  }
}
