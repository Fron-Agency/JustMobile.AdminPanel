import { NextResponse } from "next/server"
import { AgentsService } from "@/app/api/modules/agents/agents.service"
import { updateAgentSchema } from "@/app/api/modules/agents/agents.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const agent = await AgentsService.getById(id, auth.via === "apiKey")
    return NextResponse.json(agent)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Agent not found" },
      { status: 404 }
    )
  }
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
    const parsed = updateAgentSchema.parse(body)
    const updated = await AgentsService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update agent" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    await AgentsService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete agent" },
      { status: 400 }
    )
  }
}
