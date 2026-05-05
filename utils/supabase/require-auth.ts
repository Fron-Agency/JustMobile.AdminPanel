import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const supabase = createClient(await cookies())
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  return { userId: user.id }
}
