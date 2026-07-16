import { NextResponse } from "next/server"
import { Resend } from "resend"
import { colosPrisma } from "@/lib/colos-prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

const TOKEN_TTL_MS = 10 * 60 * 1000

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const user = await colosPrisma.user.findUnique({ where: { email } })

    // Always return success, regardless of whether the email exists,
    // so this endpoint can't be used to enumerate registered accounts.
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true })
    }

    const tokenRow = await colosPrisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    })

    const origin = req.headers.get("origin") ?? new URL(req.url).origin
    const resetLink = `${origin}/reset-password/colos?token=${tokenRow.token}`

    const html = `
      <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #fff;">
        <div style="background: #0f172a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px; font-weight: 600;">Colos</h1>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Password Reset</p>
        </div>
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 14px; line-height: 1.5;">Hi ${user.name ?? ""},</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.5;">
            We received a request to reset your password. This link is valid for 10 minutes.
          </p>
          <p style="margin: 0 0 24px;">
            <a href="${resetLink}" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Reset your password</a>
          </p>
          <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px; line-height: 1.5;">
            If you didn&rsquo;t request this, you can safely ignore this email.
          </p>
          <p style="margin-top: 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f0f0f0; padding-top: 16px;">
            Sent from Colos Admin Panel
          </p>
        </div>
      </div>
    `

    const { error: sendError } = await resend.emails.send({
      from: "Colos <info@colos.ch>",
      to: [user.email],
      subject: "Reset your password",
      html,
    })

    if (sendError) {
      return NextResponse.json({ message: sendError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
