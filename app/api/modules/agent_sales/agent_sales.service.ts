import { AgentSalesRepository } from "./agent_sales.repository"
import { AgentsService } from "../agents/agents.service"
import { UserTargetsService } from "../user_targets/user_targets.service"
import type {
  AgentSalesFilterInput,
  SaveTargetSalesInput,
  UpdateAgentSaleInput,
  UpsertAgentSaleInput,
} from "./agent_sales.validation"
import type { AgentHistoryEntry, AgentSale, TargetBoard, TargetBoardEntry } from "./agent_sales.types"

// Calendar date (YYYY-MM-DD) of a timestamp in Europe/Zurich.
function zurichDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date(timestamp))
}

export const AgentSalesService = {
  async getAll(filter: AgentSalesFilterInput = {}, asService = false): Promise<AgentSale[]> {
    return AgentSalesRepository.findAll(filter, asService)
  },

  async getById(id: string, asService = false): Promise<AgentSale> {
    const sale = await AgentSalesRepository.findById(id, asService)
    if (!sale) throw new Error("Agent sales entry not found")
    return sale
  },

  // One row per (target, agent): update it if present, otherwise create it.
  async upsert(input: UpsertAgentSaleInput): Promise<AgentSale> {
    await Promise.all([
      UserTargetsService.getById(input.user_target_id),
      AgentsService.getById(input.agent_id),
    ])

    const existing = await AgentSalesRepository.findByTargetAndAgent(input.user_target_id, input.agent_id)
    return existing
      ? AgentSalesRepository.update(existing.id, { sales: input.sales })
      : AgentSalesRepository.create(input)
  },

  async update(id: string, input: UpdateAgentSaleInput): Promise<AgentSale> {
    await AgentSalesService.getById(id)
    return AgentSalesRepository.update(id, input)
  },

  async delete(id: string): Promise<void> {
    await AgentSalesService.getById(id)
    return AgentSalesRepository.delete(id)
  },

  // Every agent for one target, sorted by sales. Agents without a row are at 0,
  // so new agents and new targets start from 0 without seeding rows.
  async getTargetBoard(userTargetId: string, asService = false): Promise<TargetBoard> {
    const [target, agents, sales] = await Promise.all([
      UserTargetsService.getById(userTargetId, asService),
      AgentsService.getAll(asService),
      AgentSalesRepository.findAll({ user_target_id: userTargetId }, asService),
    ])

    const saleByAgent = new Map(sales.map((s) => [s.agent_id, s]))

    const entries: TargetBoardEntry[] = agents
      .map((agent) => {
        const sale = saleByAgent.get(agent.id)
        return {
          agent_id: agent.id,
          first_name: agent.first_name,
          last_name: agent.last_name,
          sales: sale?.sales ?? 0,
          agent_sale_id: sale?.id ?? null,
        }
      })
      .sort(
        (a, b) =>
          b.sales - a.sales ||
          a.first_name.localeCompare(b.first_name) ||
          a.last_name.localeCompare(b.last_name)
      )

    return {
      target,
      agents: entries,
      total_sales: entries.reduce((sum, e) => sum + e.sales, 0),
    }
  },

  // Saves several agents of one target in one request (the admin "Sales" grid).
  async saveTargetSales(userTargetId: string, input: SaveTargetSalesInput): Promise<TargetBoard> {
    const [, agents, existing] = await Promise.all([
      UserTargetsService.getById(userTargetId),
      AgentsService.getAll(),
      AgentSalesRepository.findAll({ user_target_id: userTargetId }),
    ])

    const agentIds = new Set(agents.map((a) => a.id))
    const unknown = input.entries.find((e) => !agentIds.has(e.agent_id))
    if (unknown) throw new Error(`Agent not found: ${unknown.agent_id}`)

    const existingByAgent = new Map(existing.map((s) => [s.agent_id, s]))

    await Promise.all(
      input.entries.map((entry) => {
        const row = existingByAgent.get(entry.agent_id)
        if (row) {
          return row.sales === entry.sales ? null : AgentSalesRepository.update(row.id, { sales: entry.sales })
        }
        return AgentSalesRepository.create({ user_target_id: userTargetId, agent_id: entry.agent_id, sales: entry.sales })
      })
    )

    return AgentSalesService.getTargetBoard(userTargetId)
  },

  // An agent's sales across targets, newest target first. Targets that ended
  // before the agent was created are left out instead of showing a misleading 0.
  async getAgentHistory(agentId: string, asService = false): Promise<AgentHistoryEntry[]> {
    const [agent, targets, sales] = await Promise.all([
      AgentsService.getById(agentId, asService),
      UserTargetsService.getAll(asService),
      AgentSalesRepository.findAll({ agent_id: agentId }, asService),
    ])

    const saleByTarget = new Map(sales.map((s) => [s.user_target_id, s]))
    const createdOn = zurichDate(agent.created_at)

    return targets
      .filter((t) => saleByTarget.has(t.id) || !t.end_date || t.end_date >= createdOn)
      .map((t) => ({
        user_target_id: t.id,
        target_name: t.target_name,
        target: t.target,
        start_date: t.start_date,
        end_date: t.end_date,
        sales: saleByTarget.get(t.id)?.sales ?? 0,
      }))
  },
}
