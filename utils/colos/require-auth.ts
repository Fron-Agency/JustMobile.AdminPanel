import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ColosAuthService } from "@/app/api/modules/colos/colos-auth.service"

export const COLOS_SESSION_COOKIE = "colos_session"

export async function requireColosAuth(): Promise<{ userId: string } | NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COLOS_SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const user = await ColosAuthService.getUserByToken(token)
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  return { userId: user.id }
}
