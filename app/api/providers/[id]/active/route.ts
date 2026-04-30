import { NextResponse } from "next/server"
import { ProviderService } from "@/app/api/modules/providers/providers.service"
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
    const updated = await ProviderService.update(id, body.is_active)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update provider status" },
      { status: 400 }
    )
  }
}