import { AgentsRepository } from "./agents.repository"
import type { CreateAgentInput, UpdateAgentInput } from "./agents.validation"
import type { Agent } from "./agents.types"
import { sameTeam } from "@/lib/sales-format"

export const AgentsService = {
  // team: only agents of that team (case-insensitive).
  async getAll(asService = false, team?: string): Promise<Agent[]> {
    const agents = await AgentsRepository.findAll(asService)
    return team ? agents.filter((a) => sameTeam(a.team, team)) : agents
  },

  async getById(id: string, asService = false): Promise<Agent> {
    const agent = await AgentsRepository.findById(id, asService)
    if (!agent) throw new Error("Agent not found")
    return agent
  },

  async create(input: CreateAgentInput): Promise<Agent> {
    return AgentsRepository.create(input)
  },

  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    await AgentsService.getById(id)
    return AgentsRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    await AgentsService.getById(id)
    return AgentsRepository.delete(id)
  },
}
