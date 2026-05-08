import { SupportService } from "@/app/api/modules/support/support.service"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const conversations = await SupportService.getConversations()
    return Response.json(conversations)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}
