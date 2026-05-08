import { SupportService } from "@/app/api/modules/support/support.service"
import { updateConversationStatusSchema } from "@/app/api/modules/support/support.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const conversation = await SupportService.getById(id)
    return Response.json(conversation)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 404 }
    )
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateConversationStatusSchema.parse(body)
    const updated = await SupportService.updateStatus(id, parsed.status)
    return Response.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
