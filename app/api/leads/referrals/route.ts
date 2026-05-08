import { NextResponse } from "next/server"
import { LeadService } from "@/app/api/modules/leads/leads.service"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const referrals = await LeadService.getReferrals()
  return Response.json(referrals)
}
