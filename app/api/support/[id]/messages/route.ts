import { SupportService } from "@/app/api/modules/support/support.service"
import { sendMessageSchema } from "@/app/api/modules/support/support.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const messages = await SupportService.getMessages(id)
    return Response.json(messages)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = sendMessageSchema.parse(body)
    const message = await SupportService.sendMessage({
      conversation_id: id,
      sender: "admin",
      content: parsed.content,
    })
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
