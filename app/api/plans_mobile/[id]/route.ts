import { NextResponse } from "next/server"
import { PlanService } from "@/app/api/modules/plans_mobile/plans_mobile.service"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  await PlanService.delete(id)
  return Response.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const { country_zones, ...rest } = body
    const zones = Array.isArray(country_zones) ? country_zones : undefined
    const updated = await PlanService.update(id, rest, zones)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 400 }
    )
  }
}
