import { NextResponse } from "next/server"
import { LeadService } from "@/app/api/modules/leads/leads.service"
import { updateLeadSchema } from "@/app/api/modules/leads/leads.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const lead = await LeadService.getById(id)
    return Response.json(lead)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Lead not found" },
      { status: 404 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateLeadSchema.parse(body)
    const updated = await LeadService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update lead" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  await LeadService.delete(id)
  return Response.json({ success: true })
}
