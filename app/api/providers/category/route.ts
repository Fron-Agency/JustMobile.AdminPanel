import { NextResponse } from "next/server"
import { ProviderService } from "../../modules/providers/providers.service"
import { requireAuth } from "@/utils/supabase/require-auth"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const categories = await ProviderService.getProvidersAndCategories()
  return Response.json(categories)
}
