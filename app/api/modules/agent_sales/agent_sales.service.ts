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
import type { Agent } from "../agents/agents.types"
import type { UserTarget } from "../user_targets/user_targets.types"
import { targetAppliesToAgent } from "@/lib/sales-format"

// Calendar date (YYYY-MM-DD) of a timestamp in Europe/Zurich.
function zurichDate(timestamp: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date(timestamp))
}

// An agent belongs on a target's board if the target applies to their team,
// or if they already have sales recorded for it (e.g. they changed team later),
// so history is never hidden.
function belongsToTarget(target: UserTarget, agent: Agent, hasSalesRow: boolean): boolean {
  return hasSalesRow || targetAppliesToAgent(target.team, agent.team)
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
    const [target, agent, existing] = await Promise.all([
      UserTargetsService.getById(input.user_target_id),
      AgentsService.getById(input.agent_id),
      AgentSalesRepository.findByTargetAndAgent(input.user_target_id, input.agent_id),
    ])

    if (!belongsToTarget(target, agent, !!existing)) {
      throw new Error(`${agent.first_name} ${agent.last_name} is not in team ${target.team} of this target`)
    }

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

  // The target's agents (its team, or everyone if it has no team), sorted by
  // sales. Agents without a row are at 0, so new agents and targets start from 0.
  async getTargetBoard(userTargetId: string, asService = false): Promise<TargetBoard> {
    const [target, agents, sales] = await Promise.all([
      UserTargetsService.getById(userTargetId, asService),
      AgentsService.getAll(asService),
      AgentSalesRepository.findAll({ user_target_id: userTargetId }, asService),
    ])

    const saleByAgent = new Map(sales.map((s) => [s.agent_id, s]))

    const entries: TargetBoardEntry[] = agents
      .filter((agent) => belongsToTarget(target, agent, saleByAgent.has(agent.id)))
      .map((agent) => {
        const sale = saleByAgent.get(agent.id)
        return {
          agent_id: agent.id,
          first_name: agent.first_name,
          last_name: agent.last_name,
          team: agent.team,
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
    const [target, agents, existing] = await Promise.all([
      UserTargetsService.getById(userTargetId),
      AgentsService.getAll(),
      AgentSalesRepository.findAll({ user_target_id: userTargetId }),
    ])

    const agentById = new Map(agents.map((a) => [a.id, a]))
    const existingByAgent = new Map(existing.map((s) => [s.agent_id, s]))

    for (const entry of input.entries) {
      const agent = agentById.get(entry.agent_id)
      if (!agent) throw new Error(`Agent not found: ${entry.agent_id}`)
      if (!belongsToTarget(target, agent, existingByAgent.has(agent.id))) {
        throw new Error(`${agent.first_name} ${agent.last_name} is not in team ${target.team} of this target`)
      }
    }

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

  // An agent's sales across the targets of their team (and team-less targets),
  // newest first. Targets that ended before the agent was created are left out
  // instead of showing a misleading 0; targets with recorded sales always stay.
  async getAgentHistory(agentId: string, asService = false): Promise<AgentHistoryEntry[]> {
    const [agent, targets, sales] = await Promise.all([
      AgentsService.getById(agentId, asService),
      UserTargetsService.getAll(asService),
      AgentSalesRepository.findAll({ agent_id: agentId }, asService),
    ])

    const saleByTarget = new Map(sales.map((s) => [s.user_target_id, s]))
    const createdOn = zurichDate(agent.created_at)

    return targets
      .filter(
        (t) =>
          saleByTarget.has(t.id) ||
          (targetAppliesToAgent(t.team, agent.team) && (!t.end_date || t.end_date >= createdOn))
      )
      .map((t) => ({
        user_target_id: t.id,
        target_name: t.target_name,
        target: t.target,
        start_date: t.start_date,
        end_date: t.end_date,
        team: t.team,
        sales: saleByTarget.get(t.id)?.sales ?? 0,
      }))
  },
}
