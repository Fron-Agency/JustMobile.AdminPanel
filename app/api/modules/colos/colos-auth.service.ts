import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export const ColosAuthService = {
  async login(email: string, password: string) {
    const user = await prisma.colosUser.findUnique({ where: { email } })
    if (!user || !user.isActive) return null

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return null

    const token = crypto.randomUUID()
    const session = await prisma.colosSession.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    })

    return { session, user }
  },

  async logout(token: string) {
    await prisma.colosSession.deleteMany({ where: { token } })
  },

  async getUserByToken(token: string) {
    const session = await prisma.colosSession.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) return null
    if (!session.user.isActive) return null

    return session.user
  },
}
