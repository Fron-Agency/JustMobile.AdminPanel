import { NextResponse } from "next/server"
import { ProviderService } from "@/app/api/modules/providers/providers.service"
import { requireAuth } from "@/utils/supabase/require-auth"
import { z } from "zod"

const updateActiveSchema = z.object({
  is_active: z.boolean(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = updateActiveSchema.parse(await req.json())
    const updated = await ProviderService.update(id, { is_active: body.is_active })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update provider status" },
      { status: 400 }
    )
  }
}
