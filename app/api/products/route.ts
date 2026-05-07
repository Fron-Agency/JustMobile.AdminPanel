import { NextResponse } from "next/server"
import { ProductService } from "../modules/products/products.service"
import { createProductSchema } from "../modules/products/products.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const products = await ProductService.getAll()
  return Response.json(products)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createProductSchema.parse(body)
    const product = await ProductService.create(parsed)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
