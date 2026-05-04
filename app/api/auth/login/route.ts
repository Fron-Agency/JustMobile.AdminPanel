import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSession, COOKIE_NAME, EXPIRES_MS } from "@/lib/session"
import { verifyPassword, hashPassword } from "@/lib/password"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, fullname, email, password, role, is_active, first_login_executed")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ message: "Your account is inactive. Contact an administrator." }, { status: 403 })
    }

    const isHashed = user.password.startsWith("pbkdf2:")
    let passwordValid = false

    if (isHashed) {
      passwordValid = await verifyPassword(password, user.password)
    } else {
      // Legacy plaintext password — compare directly and migrate on success
      passwordValid = user.password === password
      if (passwordValid) {
        const hashed = await hashPassword(password)
        await supabase.from("users").update({ password: hashed }).eq("id", user.id)
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
    })

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      first_login_executed: user.first_login_executed,
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_MS / 1000,
    })

    return response
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
