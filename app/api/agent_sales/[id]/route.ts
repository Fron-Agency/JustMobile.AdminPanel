import { NextResponse } from "next/server"
import { AgentSalesService } from "@/app/api/modules/agent_sales/agent_sales.service"
import { updateAgentSaleSchema } from "@/app/api/modules/agent_sales/agent_sales.validation"
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
    const sale = await AgentSalesService.getById(id, auth.via === "apiKey")
    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Agent sales entry not found" },
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
    const parsed = updateAgentSaleSchema.parse(body)
    const updated = await AgentSalesService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update sales" },
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
    await AgentSalesService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete sales" },
      { status: 400 }
    )
  }
}
