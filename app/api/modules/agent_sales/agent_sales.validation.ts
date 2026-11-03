import { z } from "zod"
import { SALES_CATEGORIES, type SalesCategory } from "./agent_sales.types"

const amount = z.number().finite().min(0, "Values cannot be negative")

// Every category is optional: only the categories sent are changed.
const categoryFields = Object.fromEntries(SALES_CATEGORIES.map((c) => [c, amount.optional()])) as Record<
  SalesCategory,
  z.ZodOptional<typeof amount>
>

const hasAnyCategory = (data: Partial<Record<SalesCategory, number>>) =>
  SALES_CATEGORIES.some((c) => data[c] !== undefined)

const categoryRequired = { message: `Provide at least one of: ${SALES_CATEGORIES.join(", ")}.` }

export const agentSalesFilterSchema = z.object({
  user_target_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
})

export type AgentSalesFilterInput = z.infer<typeof agentSalesFilterSchema>

// POST /api/agent_sales: creates the (target, agent) row or updates it if it exists.
export const upsertAgentSaleSchema = z
  .object({
    user_target_id: z.string().uuid(),
    agent_id: z.string().uuid(),
    ...categoryFields,
  })
  .refine(hasAnyCategory, categoryRequired)

export type UpsertAgentSaleInput = z.infer<typeof upsertAgentSaleSchema>

export const updateAgentSaleSchema = z.object(categoryFields).refine(hasAnyCategory, categoryRequired)

export type UpdateAgentSaleInput = z.infer<typeof updateAgentSaleSchema>

// PUT /api/user_targets/[id]/sales: save several agents of one target at once.
export const saveTargetSalesSchema = z.object({
  entries: z
    .array(z.object({ agent_id: z.string().uuid(), ...categoryFields }).refine(hasAnyCategory, categoryRequired))
    .min(1)
    .max(500)
    .refine((entries) => new Set(entries.map((e) => e.agent_id)).size === entries.length, {
      message: "Each agent may appear only once.",
    }),
})

export type SaveTargetSalesInput = z.infer<typeof saveTargetSalesSchema>
