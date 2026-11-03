import type { UserTarget } from "../user_targets/user_targets.types"

/**
 * The sales categories recorded per agent and target, in display order.
 * API names; the DB column for "mietkaution" is spelled "mietkatution"
 * (mapped in agent_sales.repository.ts).
 */
export const SALES_CATEGORIES = ["sales", "mietkaution", "termine", "yallo_lebara", "salt", "salt_ret"] as const

export type SalesCategory = (typeof SALES_CATEGORIES)[number]

/** The category compared against a target's goal (progress, "reached"). */
export const TARGET_CATEGORY: SalesCategory = "sales"

/** One number per category; NULL in the DB is returned as 0. */
export type SalesValues = Record<SalesCategory, number>

export const emptySalesValues = (): SalesValues =>
  Object.fromEntries(SALES_CATEGORIES.map((c) => [c, 0])) as SalesValues

/** One agent's numbers for one target. Exposed as `agent_id` (DB column: `agnet_id`). */
export interface AgentSale extends SalesValues {
  id: string
  user_target_id: string
  agent_id: string
}

export interface CreateAgentSaleDto extends SalesValues {
  user_target_id: string
  agent_id: string
}

export type UpdateAgentSaleDto = Partial<SalesValues>

export interface AgentSalesFilter {
  user_target_id?: string
  agent_id?: string
}

/** One row of a target's board: the target's agents, 0 where nothing was recorded yet. */
export interface TargetBoardEntry extends SalesValues {
  agent_id: string
  first_name: string
  last_name: string
  team: string | null
  /** agent_sales row id, or null while the agent has no row for this target. */
  agent_sale_id: string | null
}

export interface TargetBoard {
  target: UserTarget
  agents: TargetBoardEntry[]
  /** Team totals per category. */
  totals: SalesValues
  /** Same as totals.sales (kept for existing callers). */
  total_sales: number
}

/** One target in an agent's history. */
export interface AgentHistoryEntry extends SalesValues {
  user_target_id: string
  target_name: string | null
  target: number
  start_date: string
  end_date: string | null
  team: string | null
}
