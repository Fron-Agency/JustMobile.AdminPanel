import { NextResponse } from "next/server"
import { z } from "zod"
import { ColosUserService } from "@/app/api/modules/colos/colos-users.service"
import { requireColosAuth } from "@/utils/colos/require-auth"

const updateActiveSchema = z.object({
  is_active: z.boolean(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = updateActiveSchema.parse(await req.json())
    const updated = await ColosUserService.update(id, { isActive: body.is_active })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update user status" },
      { status: 400 }
    )
  }
}
