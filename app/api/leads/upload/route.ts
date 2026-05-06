import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const BUCKET = "leads-files"

export async function POST(req: Request) {
  const supabase = createClient(await cookies())
  const formData = await req.formData()

  const files = formData.getAll("files") as File[]
  const file_urls: string[] = []

  for (const file of files) {
    const ext = file.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from("leads-files")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    file_urls.push(fileName)
  }

  return NextResponse.json({ file_urls })
}