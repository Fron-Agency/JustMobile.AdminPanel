import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"

const BUCKET = "partners-logo"

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = createClient(await cookies())
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ file_url: fileName })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    )
  }
}
