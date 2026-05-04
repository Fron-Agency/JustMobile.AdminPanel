import { PartnerService } from "@/app/api/modules/partners/partners.service"
import { NextResponse } from "next/server"
import { createPartnerSchema } from "../modules/partners/partners.validation"

export async function GET() {
  const partners = await PartnerService.getAll()
  return Response.json(partners)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createPartnerSchema.parse(body)
    const partner = await PartnerService.create(parsed)
    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}
