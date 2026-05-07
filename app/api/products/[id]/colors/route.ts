import { NextResponse } from "next/server"
import { ProductService } from "@/app/api/modules/products/products.service"
import { createColorSchema } from "@/app/api/modules/products/products.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = createColorSchema.parse(body)
    const color = await ProductService.createColor(id, parsed)
    return NextResponse.json(color, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
