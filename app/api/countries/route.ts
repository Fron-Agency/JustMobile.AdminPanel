import { NextResponse } from "next/server"
import { CountryService } from "@/app/api/modules/countries/countries.service"
import { createCountrySchema } from "@/app/api/modules/countries/countries.validation"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  try {
    const countries = await CountryService.getAll()
    return Response.json(countries)
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
    const parsed = createCountrySchema.parse(body)
    const country = await CountryService.create(parsed)
    return NextResponse.json(country, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
