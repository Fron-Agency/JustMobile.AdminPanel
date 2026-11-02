import { NextResponse } from "next/server"
import { AgentSalesService } from "@/app/api/modules/agent_sales/agent_sales.service"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// An agent's sales history across targets, newest target first.
// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const history = await AgentSalesService.getAgentHistory(id, auth.via === "apiKey")
    return NextResponse.json(history)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Agent not found" },
      { status: 404 }
    )
  }
}
