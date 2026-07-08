import { NextResponse } from "next/server"
import { ColosUserService } from "@/app/api/modules/colos/colos-users.service"
import { updateColosUserSchema } from "@/app/api/modules/colos/colos-users.validation"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  await ColosUserService.delete(id)
  return Response.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateColosUserSchema.parse(body)
    const updated = await ColosUserService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update user" },
      { status: 400 }
    )
  }
}
