import { NextResponse } from "next/server"
import { CandidatesService } from "@/app/api/modules/candidates/candidates.service"
import { updateCandidateStatusSchema } from "@/app/api/modules/candidates/candidates.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const candidate = await CandidatesService.getById(id)
    return NextResponse.json(candidate)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Candidate not found" },
      { status: 404 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateCandidateStatusSchema.parse(body)
    const updated = await CandidatesService.updateStatus(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update candidate" },
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
  await CandidatesService.delete(id)
  return Response.json({ success: true })
}
