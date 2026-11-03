import { NextResponse } from "next/server"
import { AgentsService } from "@/app/api/modules/agents/agents.service"
import { createAgentSchema } from "@/app/api/modules/agents/agents.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// Optional ?team=A returns only that team's agents.
// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(request: Request) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const team = new URL(request.url).searchParams.get("team")?.trim() || undefined
    const agents = await AgentsService.getAll(auth.via === "apiKey", team)
    return NextResponse.json(agents)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createAgentSchema.parse(body)
    const agent = await AgentsService.create(parsed)
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
