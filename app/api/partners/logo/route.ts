import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { requireAuth } from "@/utils/supabase/require-auth"
import sharp from "sharp"

const BUCKET = "partners-logo"

export async function POST(req: Request) {
  const auth = await requireAuth()

  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const supabase = await createClient(await cookies())

    const formData = await req.formData()

    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize image
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 600,
        withoutEnlargement: true,
      })
      .webp({
        quality: 75,
      })
      .toBuffer()

    const fileName = `${crypto.randomUUID()}.webp`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, optimizedBuffer, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000",
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      file_url: fileName,
    })
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Upload failed",
      },
      { status: 500 }
    )
  }
}