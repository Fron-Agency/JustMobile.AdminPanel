import { NextResponse } from "next/server"
import { CountryService } from "@/app/api/modules/countries/countries.service"
import { updateCountrySchema } from "@/app/api/modules/countries/countries.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateCountrySchema.parse(body)
    const updated = await CountryService.update(id, parsed)
    return Response.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    await CountryService.delete(id)
    return Response.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
