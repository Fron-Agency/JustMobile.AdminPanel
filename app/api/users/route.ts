import { UserService } from "@/app/api/modules/users/users.service"
import { NextResponse } from "next/dist/server/web/spec-extension/response"
import { createUserSchema } from "../modules/users/users.validation"

export async function GET() {
  const users = await UserService.getAll()
  return Response.json(users)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createUserSchema.parse(body)

    const user = await UserService.create(parsed)

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}