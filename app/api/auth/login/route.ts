import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: (ctSet) => ctSet.forEach((c) => cookiesToSet.push(c)),
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Query public.users for profile data using the authenticated session
    const authedSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
        global: {
          headers: { Authorization: `Bearer ${authData.session.access_token}` },
        },
      }
    )

    const { data: profile, error: profileError } = await authedSupabase
      .from("users")
      .select("id, fullname, role, is_active, first_login_executed")
      .eq("id", authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 })
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { message: "Your account is inactive. Contact an administrator." },
        { status: 403 }
      )
    }

    const response = NextResponse.json({
      id: profile.id,
      email: authData.user.email,
      fullname: profile.fullname,
      role: profile.role,
      first_login_executed: profile.first_login_executed,
    })

    // Attach Supabase auth cookies to the response
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    })

    return response
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
