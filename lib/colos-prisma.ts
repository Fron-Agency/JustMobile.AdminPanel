import { PrismaClient } from "@/app/generated/colos"

const globalForPrisma = globalThis as unknown as { colosPrisma?: PrismaClient }

export const colosPrisma = globalForPrisma.colosPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.colosPrisma = colosPrisma
