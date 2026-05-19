import { LeadHomeService } from "@/app/api/modules/leads_home/leads_home.service"
import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"
import { createLeadHomeSchema } from "../modules/leads_home/leads_home.validation"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const leads = await LeadHomeService.getAll()
    return Response.json(leads)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createLeadHomeSchema.parse(body)
    const lead = await LeadHomeService.create(parsed)
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
