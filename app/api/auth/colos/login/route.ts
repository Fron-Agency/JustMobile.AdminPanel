import { NextResponse } from "next/server"
import { ColosAuthService } from "@/app/api/modules/colos/colos-auth.service"
import { COLOS_SESSION_COOKIE } from "@/utils/colos/require-auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const result = await ColosAuthService.login(email, password)
    if (!result) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const response = NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    })

    response.cookies.set(COLOS_SESSION_COOKIE, result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.session.expiresAt,
    })

    return response
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
