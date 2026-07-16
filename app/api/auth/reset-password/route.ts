import { NextResponse } from "next/server"
import { adminClient } from "@/utils/supabase/admin"

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ message: "Token and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { data: tokenRow, error: tokenError } = await adminClient
      .from("password_reset_tokens")
      .select("token, user_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle()

    if (tokenError || !tokenRow) {
      return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 })
    }

    if (tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 })
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(tokenRow.user_id, {
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 500 })
    }

    await adminClient
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
