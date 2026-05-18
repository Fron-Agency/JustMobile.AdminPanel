import { NextResponse } from "next/server"
import { PlanHomeService } from "@/app/api/modules/plans_home/plans_home.service"
import { updatePlanHomeSchema } from "@/app/api/modules/plans_home/plans_home.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const plan = await PlanHomeService.getById(id)
    return Response.json(plan)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    )
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updatePlanHomeSchema.parse(body)
    const updated = await PlanHomeService.update(id, parsed)
    return Response.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    await PlanHomeService.delete(id)
    return Response.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
