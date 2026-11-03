import type { UserTarget } from "../user_targets/user_targets.types"

/** One agent's sales for one target. Exposed as `agent_id` (DB column: `agnet_id`). */
export interface AgentSale {
  id: string
  user_target_id: string
  agent_id: string
  sales: number
}

export interface CreateAgentSaleDto {
  user_target_id: string
  agent_id: string
  sales: number
}

export interface UpdateAgentSaleDto {
  sales: number
}

export interface AgentSalesFilter {
  user_target_id?: string
  agent_id?: string
}

/** One row of a target's board: every agent, 0 if no sales were recorded yet. */
export interface TargetBoardEntry {
  agent_id: string
  first_name: string
  last_name: string
  team: string | null
  sales: number
  /** agent_sales row id, or null while the agent is still at 0 with no row. */
  agent_sale_id: string | null
}

export interface TargetBoard {
  target: UserTarget
  agents: TargetBoardEntry[]
  total_sales: number
}

/** One target in an agent's history. */
export interface AgentHistoryEntry {
  user_target_id: string
  target_name: string | null
  target: number
  start_date: string
  end_date: string | null
  team: string | null
  sales: number
}
