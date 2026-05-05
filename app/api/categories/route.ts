import { CategoryService } from "@/app/api/modules/categories/categories.service"
import { NextResponse } from "next/dist/server/web/spec-extension/response"
import { createCategorySchema } from "../modules/categories/categories.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const categories = await CategoryService.getAll()
  return Response.json(categories)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createCategorySchema.parse(body)
    const category = await CategoryService.create(parsed)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
