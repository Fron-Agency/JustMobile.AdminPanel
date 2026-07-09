import { CandidatesService } from "@/app/api/modules/candidates/candidates.service"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"
import { createCandidateSchema } from "@/app/api/modules/candidates/candidates.validation"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const candidates = await CandidatesService.getAll()
  return Response.json(candidates)
}

// Server-to-server intake for OptimusMarketing's careers form. No user
// session — guarded by a static API key instead of requireAuth().
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey || apiKey !== process.env.CAREERS_FORM_API_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 })
  }

  const parsed = createCandidateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 })
  }

  try {
    const candidate = await CandidatesService.create(parsed.data)
    return NextResponse.json({ ok: true, candidate }, { status: 201 })
  } catch (err) {
    console.error("[candidates.create] Unexpected error:", err)
    return NextResponse.json({ ok: false, error: "Failed to create candidate." }, { status: 500 })
  }
}
