import { NextResponse } from "next/server"
import { PartnerService } from "@/app/api/modules/partners/partners.service"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await PartnerService.update(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update partner" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await PartnerService.delete(id)
  return Response.json({ success: true })
}
