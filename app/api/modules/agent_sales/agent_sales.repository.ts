import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import type {
  AgentSale,
  AgentSalesFilter,
  CreateAgentSaleDto,
  UpdateAgentSaleDto,
} from "./agent_sales.types"

// The DB column is spelled "agnet_id". It is only referenced here; the rest of
// the app uses `agent_id`. If the column is renamed, update these two lines.
const AGENT_ID_COLUMN = "agnet_id"
type AgentSaleRow = { id: string; user_target_id: string; agnet_id: string; sales: number | string }

// `numeric` can come back as a string; keep `sales` a number for callers.
const toAgentSale = (row: AgentSaleRow): AgentSale => ({
  id: row.id,
  user_target_id: row.user_target_id,
  agent_id: row[AGENT_ID_COLUMN],
  sales: Number(row.sales),
})

// asService: the OptimusMarketing website reads through an API key with no
// Supabase session, so those reads use the service-role client to bypass RLS.
async function client(asService = false) {
  return asService ? adminClient : createClient(await cookies())
}

export const AgentSalesRepository = {
  async findAll(filter: AgentSalesFilter = {}, asService = false): Promise<AgentSale[]> {
    const supabase = await client(asService)
    let query = supabase.from("agent_sales").select("*")
    if (filter.user_target_id) query = query.eq("user_target_id", filter.user_target_id)
    if (filter.agent_id) query = query.eq(AGENT_ID_COLUMN, filter.agent_id)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data as AgentSaleRow[]).map(toAgentSale)
  },

  async findById(id: string, asService = false): Promise<AgentSale | null> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("agent_sales")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toAgentSale(data as AgentSaleRow) : null
  },

  // limit(1): the table has no unique (target, agent) constraint yet, so tolerate
  // an accidental duplicate instead of failing the read.
  async findByTargetAndAgent(userTargetId: string, agentId: string): Promise<AgentSale | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .select("*")
      .eq("user_target_id", userTargetId)
      .eq(AGENT_ID_COLUMN, agentId)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toAgentSale(data as AgentSaleRow) : null
  },

  async create(payload: CreateAgentSaleDto): Promise<AgentSale> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .insert([{ user_target_id: payload.user_target_id, [AGENT_ID_COLUMN]: payload.agent_id, sales: payload.sales }])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toAgentSale(data as AgentSaleRow)
  },

  async update(id: string, payload: UpdateAgentSaleDto): Promise<AgentSale> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .update({ sales: payload.sales })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toAgentSale(data as AgentSaleRow)
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("agent_sales").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
