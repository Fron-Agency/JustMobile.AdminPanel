import { NextRequest, NextResponse } from "next/server"
import { verifySession, COOKIE_NAME } from "@/lib/session"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value ?? null
  const session = token ? await verifySession(token) : null

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")
  const isLogin = request.nextUrl.pathname === "/login"

  if (!session && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
