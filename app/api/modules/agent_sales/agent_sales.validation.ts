import { z } from "zod"

const sales = z.number().finite().min(0, "Sales cannot be negative")

export const agentSalesFilterSchema = z.object({
  user_target_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
})

export type AgentSalesFilterInput = z.infer<typeof agentSalesFilterSchema>

// POST /api/agent_sales: creates the (target, agent) row or updates it if it exists.
export const upsertAgentSaleSchema = z.object({
  user_target_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  sales,
})

export type UpsertAgentSaleInput = z.infer<typeof upsertAgentSaleSchema>

export const updateAgentSaleSchema = z.object({ sales })

export type UpdateAgentSaleInput = z.infer<typeof updateAgentSaleSchema>

// PUT /api/user_targets/[id]/sales: save several agents of one target at once.
export const saveTargetSalesSchema = z.object({
  entries: z
    .array(z.object({ agent_id: z.string().uuid(), sales }))
    .min(1)
    .max(500)
    .refine((entries) => new Set(entries.map((e) => e.agent_id)).size === entries.length, {
      message: "Each agent may appear only once.",
    }),
})

export type SaveTargetSalesInput = z.infer<typeof saveTargetSalesSchema>
