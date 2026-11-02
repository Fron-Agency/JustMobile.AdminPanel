import { NextResponse } from "next/server"
import { AgentSalesService } from "@/app/api/modules/agent_sales/agent_sales.service"
import { saveTargetSalesSchema } from "@/app/api/modules/agent_sales/agent_sales.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// Board for one target: every agent with their sales (0 if none recorded yet).
// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const board = await AgentSalesService.getTargetBoard(id, auth.via === "apiKey")
    return NextResponse.json(board)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Target not found" },
      { status: 404 }
    )
  }
}

// Save several agents' sales for this target at once; returns the updated board.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = saveTargetSalesSchema.parse(body)
    const board = await AgentSalesService.saveTargetSales(id, parsed)
    return NextResponse.json(board)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save sales" },
      { status: 400 }
    )
  }
}
