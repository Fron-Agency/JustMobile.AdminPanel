import { NextResponse } from "next/server"
import { ProductService } from "@/app/api/modules/products/products.service"
import { updatePhotoSchema } from "@/app/api/modules/products/products.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { photoId } = await params
    const body = await req.json()
    const parsed = updatePhotoSchema.parse(body)
    const updated = await ProductService.updatePhoto(photoId, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update photo" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { photoId } = await params
    await ProductService.deletePhoto(photoId)
    return Response.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete photo" },
      { status: 400 }
    )
  }
}
