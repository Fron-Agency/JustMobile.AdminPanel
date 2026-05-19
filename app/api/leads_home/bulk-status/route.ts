import { NextResponse } from "next/server"
import { LeadHomeService } from "@/app/api/modules/leads_home/leads_home.service"
import { requireAuth } from "@/utils/supabase/require-auth"
import { z } from "zod"

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(["new", "sent", "contacted", "converted", "lost"]),
})

export async function PATCH(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { ids, status } = schema.parse(body)
    const updated = await Promise.all(ids.map((id) => LeadHomeService.update(id, { status })))
    return Response.json(updated)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update leads" },
      { status: 400 }
    )
  }
}
