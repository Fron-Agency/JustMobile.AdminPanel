import { timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"

export type AuthOrApiKey = { via: "session"; userId: string } | { via: "apiKey" }

function matchesApiKey(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Read access for either an admin-panel session or a server-to-server caller
// (e.g. the OptimusMarketing website) sending `x-api-key`. A missing env key
// disables API-key access entirely.
export async function requireAuthOrApiKey(
  request: Request,
  expectedApiKey: string | undefined
): Promise<AuthOrApiKey | NextResponse> {
  if (matchesApiKey(request.headers.get("x-api-key"), expectedApiKey)) {
    return { via: "apiKey" }
  }

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  return { via: "session", userId: auth.userId }
}
