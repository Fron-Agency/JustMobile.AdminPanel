import { CategoryService } from "@/app/api/modules/categories/categories.service"
import { NextResponse } from "next/dist/server/web/spec-extension/response"
import { createCategorySchema } from "../modules/categories/categories.validation"

export async function GET() {
  const categories = await CategoryService.getAll()
  return Response.json(categories)
}

export async function POST(req: Request) {
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