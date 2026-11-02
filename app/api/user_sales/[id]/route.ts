import { NextResponse } from "next/server"
import { UserSalesService } from "@/app/api/modules/user_sales/user_sales.service"
import { updateUserSalesSchema } from "@/app/api/modules/user_sales/user_sales.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const userSales = await UserSalesService.getById(id, auth.via === "apiKey")
    return NextResponse.json(userSales)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Sales agent not found" },
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
    const parsed = updateUserSalesSchema.parse(body)
    const updated = await UserSalesService.update(id, parsed)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update sales agent" },
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
    await UserSalesService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete sales agent" },
      { status: 400 }
    )
  }
}
