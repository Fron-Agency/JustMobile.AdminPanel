import { NextResponse } from "next/server"
import { adminClient } from "@/utils/supabase/admin"

const BUCKET = "leads-files"

export async function POST(req: Request) {
  const { file_url } = await req.json()

  if (!file_url) {
    return NextResponse.json({ message: "file_url is required" }, { status: 400 })
  }

  const { data, error } = await adminClient.storage
    .from(BUCKET)
    .createSignedUrl(file_url, 60 * 5) // 5 minutes

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}