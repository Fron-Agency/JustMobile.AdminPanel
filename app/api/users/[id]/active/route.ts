import { NextResponse } from "next/server"
import { UserService } from "@/app/api/modules/users/users.service"
import { z } from "zod"

const updateActiveSchema = z.object({
  is_active: z.boolean(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = updateActiveSchema.parse(await req.json())
    const updated = await UserService.update(id, { is_active: body.is_active })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update user status" },
      { status: 400 }
    )
  }
}