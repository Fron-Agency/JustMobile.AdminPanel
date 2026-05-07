import { NextResponse } from "next/server"
import { ProductService } from "@/app/api/modules/products/products.service"
import { updateProductSchema } from "@/app/api/modules/products/products.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const product = await ProductService.getById(id)
    return Response.json(product)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Not found" },
      { status: 404 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateProductSchema.parse(body)
    const updated = await ProductService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update product" },
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

  try {
    const { id } = await params
    await ProductService.delete(id)
    return Response.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete product" },
      { status: 400 }
    )
  }
}
