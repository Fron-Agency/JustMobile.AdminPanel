import { LeadService } from "@/app/api/modules/leads/leads.service"
import { NextResponse } from "next/server"
import { createLeadSchema } from "../modules/leads/leads.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const leads = await LeadService.getAllLeadsWithRelations()
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
    const parsed = createLeadSchema.parse(body)
    const lead = await LeadService.create(parsed)
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}