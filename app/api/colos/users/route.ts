import { NextResponse } from "next/server"
import { ColosUserService } from "@/app/api/modules/colos/colos-users.service"
import { createColosUserSchema } from "@/app/api/modules/colos/colos-users.validation"
import { requireColosAuth } from "@/utils/colos/require-auth"

export async function GET() {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  const users = await ColosUserService.getAll()
  return Response.json(users)
}

export async function POST(req: Request) {
  const auth = await requireColosAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createColosUserSchema.parse(body)
    const user = await ColosUserService.create(parsed)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
