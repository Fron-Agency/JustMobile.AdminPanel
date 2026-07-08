import { colosPrisma } from "@/lib/colos-prisma"
import type { ColosUserDto, CreateColosUserDto, UpdateColosUserDto } from "./colos-users.type"

function serialize(user: {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): ColosUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as ColosUserDto["role"],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export const ColosUserRepository = {
  async findAll(): Promise<ColosUserDto[]> {
    const users = await colosPrisma.user.findMany({ orderBy: { createdAt: "desc" } })
    return users.map(serialize)
  },

  async findById(id: string): Promise<ColosUserDto | null> {
    const user = await colosPrisma.user.findUnique({ where: { id } })
    return user ? serialize(user) : null
  },

  async create(payload: CreateColosUserDto): Promise<ColosUserDto> {
    const user = await colosPrisma.user.create({
      data: {
        email: payload.email,
        name: payload.name ?? null,
        role: payload.role,
        passwordHash: payload.passwordHash,
      },
    })
    return serialize(user)
  },

  async update(id: string, payload: UpdateColosUserDto): Promise<ColosUserDto> {
    const user = await colosPrisma.user.update({
      where: { id },
      data: payload,
    })
    return serialize(user)
  },

  async delete(id: string): Promise<void> {
    await colosPrisma.user.delete({ where: { id } })
  },
}
