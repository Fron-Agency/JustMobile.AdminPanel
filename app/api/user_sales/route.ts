import { NextResponse } from "next/server"
import { UserSalesService } from "@/app/api/modules/user_sales/user_sales.service"
import { createUserSalesSchema } from "@/app/api/modules/user_sales/user_sales.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(request: Request) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const userSales = await UserSalesService.getAll(auth.via === "apiKey")
    return NextResponse.json(userSales)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createUserSalesSchema.parse(body)
    const userSales = await UserSalesService.create(parsed)
    return NextResponse.json(userSales, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
