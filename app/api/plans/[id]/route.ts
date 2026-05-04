import { NextResponse } from "next/server"
import { PlanService } from "@/app/api/modules/plans/plans.service"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await PlanService.delete(id)
  return Response.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await PlanService.update(id, body)

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 400 }
    )
  }
}