import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { newPassword } = await req.json()

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateAuthError) {
      return NextResponse.json({ message: updateAuthError.message }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from("users")
      .update({ first_login_executed: true })
      .eq("id", user.id)

    if (profileError) {
      return NextResponse.json({ message: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
