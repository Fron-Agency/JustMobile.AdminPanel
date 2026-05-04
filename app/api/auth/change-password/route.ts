import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { verifySession, COOKIE_NAME } from "@/lib/session"
import { hashPassword } from "@/lib/password"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const session = token ? await verifySession(token) : null

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { newPassword } = await req.json()

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const hashed = await hashPassword(newPassword)

    const { error } = await supabase
      .from("users")
      .update({ password: hashed, first_login_executed: true })
      .eq("id", session.id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
