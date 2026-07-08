import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ColosAuthService } from "@/app/api/modules/colos/colos-auth.service"
import { COLOS_SESSION_COOKIE } from "@/utils/colos/require-auth"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COLOS_SESSION_COOKIE)?.value

  if (token) {
    await ColosAuthService.logout(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(COLOS_SESSION_COOKIE)
  return response
}
