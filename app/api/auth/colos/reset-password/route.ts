import { NextResponse } from "next/server"
import { colosPrisma } from "@/lib/colos-prisma"
import { hashPassword } from "@/lib/password"

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ message: "Token and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const tokenRow = await colosPrisma.passwordResetToken.findUnique({ where: { token } })

    if (!tokenRow) {
      return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 })
    }

    if (tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
      return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)

    await colosPrisma.user.update({
      where: { id: tokenRow.userId },
      data: { passwordHash },
    })

    await colosPrisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
