import { NextResponse } from "next/server"
import { CategoryService } from "@/app/api/modules/categories/categories.service"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  await CategoryService.delete(id)
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
    const updated = await CategoryService.update(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update category" },
      { status: 400 }
    )
  }
}
