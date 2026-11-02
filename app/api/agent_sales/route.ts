import { NextResponse } from "next/server"
import { AgentSalesService } from "@/app/api/modules/agent_sales/agent_sales.service"
import {
  agentSalesFilterSchema,
  upsertAgentSaleSchema,
} from "@/app/api/modules/agent_sales/agent_sales.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// Raw agent_sales rows, optionally filtered: ?user_target_id=...&agent_id=...
// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(request: Request) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const parsed = agentSalesFilterSchema.safeParse({
    user_target_id: searchParams.get("user_target_id") ?? undefined,
    agent_id: searchParams.get("agent_id") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid user_target_id or agent_id" }, { status: 400 })
  }

  try {
    const sales = await AgentSalesService.getAll(parsed.data, auth.via === "apiKey")
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

// Set one agent's sales for one target (creates the row or updates the existing one).
export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = upsertAgentSaleSchema.parse(body)
    const sale = await AgentSalesService.upsert(parsed)
    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
