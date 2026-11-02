import { NextResponse } from "next/server"
import { UserTargetsService } from "@/app/api/modules/user_targets/user_targets.service"
import { createUserTargetSchema } from "@/app/api/modules/user_targets/user_targets.validation"
import { requireAuth } from "@/utils/supabase/require-auth"
import { requireAuthOrApiKey } from "@/utils/supabase/require-auth-or-api-key"

// Admin session, or OptimusMarketing website via x-api-key (CAREERS_FORM_API_KEY).
export async function GET(request: Request) {
  const auth = await requireAuthOrApiKey(request, process.env.CAREERS_FORM_API_KEY)
  if (auth instanceof NextResponse) return auth

  try {
    const targets = await UserTargetsService.getAll(auth.via === "apiKey")
    return NextResponse.json(targets)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = createUserTargetSchema.parse(body)
    const target = await UserTargetsService.create(parsed)
    return NextResponse.json(target, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
