import { CandidatesService } from "@/app/api/modules/candidates/candidates.service"
import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const candidates = await CandidatesService.getAll()
  return Response.json(candidates)
}
