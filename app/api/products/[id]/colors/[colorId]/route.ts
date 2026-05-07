import { NextResponse } from "next/server"
import { ProductService } from "@/app/api/modules/products/products.service"
import { updateColorSchema } from "@/app/api/modules/products/products.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; colorId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { colorId } = await params
    const body = await req.json()
    const parsed = updateColorSchema.parse(body)
    const updated = await ProductService.updateColor(colorId, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update color" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; colorId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { colorId } = await params
    await ProductService.deleteColor(colorId)
    return Response.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete color" },
      { status: 400 }
    )
  }
}
