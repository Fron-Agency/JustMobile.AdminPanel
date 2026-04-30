import { ProviderService } from "@/app/api/modules/providers/providers.service"
import { NextResponse } from "next/dist/server/web/spec-extension/response"
import { createProviderSchema } from "../modules/providers/providers.validation"

export async function GET() {
  const providers = await ProviderService.getAll()
  return Response.json(providers)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createProviderSchema.parse(body)

    const provider = await ProviderService.create(parsed)

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}