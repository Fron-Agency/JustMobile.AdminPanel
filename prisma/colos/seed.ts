import { PrismaClient } from "../../app/generated/colos"
import { hashPassword } from "../../lib/password"

const prisma = new PrismaClient()

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

async function main() {
  const passwordHash = await hashPassword("Test1234!")

  const admin = await prisma.user.upsert({
    where: { email: "admin@colos.test" },
    update: {},
    create: {
      email: "admin@colos.test",
      passwordHash,
      name: "Colos Admin",
      role: "ADMIN",
      isActive: true,
    },
  })

  const viewer = await prisma.user.upsert({
    where: { email: "user@colos.test" },
    update: {},
    create: {
      email: "user@colos.test",
      passwordHash,
      name: "Colos Test User",
      role: "USER",
      isActive: true,
    },
  })

  for (const user of [admin, viewer]) {
    await prisma.userSession.create({
      data: {
        token: crypto.randomUUID(),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    })
  }

  console.log("Seeded Colos users:")
  console.log(`  ${admin.email} / Test1234!  (ADMIN)`)
  console.log(`  ${viewer.email} / Test1234!  (USER)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
