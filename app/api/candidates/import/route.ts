import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"
import { CandidatesService } from "@/app/api/modules/candidates/candidates.service"
import { importCandidatesRequestSchema } from "@/app/api/modules/candidates/candidates.validation"

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 })
  }

  const parsed = importCandidatesRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid rows." },
      { status: 400 }
    )
  }

  try {
    const result = await CandidatesService.importCandidates(parsed.data.rows)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[candidates.import] Unexpected error:", err)
    return NextResponse.json({ ok: false, error: "Failed to import candidates." }, { status: 500 })
  }
}
