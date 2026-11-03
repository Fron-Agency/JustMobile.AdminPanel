import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import {
  SALES_CATEGORIES,
  type AgentSale,
  type AgentSalesFilter,
  type CreateAgentSaleDto,
  type SalesCategory,
  type UpdateAgentSaleDto,
} from "./agent_sales.types"

// DB column names, where they differ from the API names. Both typos live only
// here; if the columns are renamed, update this block.
const AGENT_ID_COLUMN = "agnet_id"
const CATEGORY_COLUMN: Record<SalesCategory, string> = {
  sales: "sales",
  mietkaution: "mietkatution",
  termine: "termine",
  yallo_lebara: "yallo_lebara",
  salt: "salt",
  salt_ret: "salt_ret",
}

type AgentSaleRow = Record<string, string | number | null>

// NULL means nothing entered yet -> 0. `numeric` may come back as a string.
const toAgentSale = (row: AgentSaleRow): AgentSale => ({
  id: String(row.id),
  user_target_id: String(row.user_target_id),
  agent_id: String(row[AGENT_ID_COLUMN]),
  ...(Object.fromEntries(
    SALES_CATEGORIES.map((c) => [c, Number(row[CATEGORY_COLUMN[c]] ?? 0)])
  ) as Record<SalesCategory, number>),
})

// Only the categories present in `values` are written.
const toCategoryColumns = (values: Partial<Record<SalesCategory, number>>) =>
  Object.fromEntries(
    SALES_CATEGORIES.filter((c) => values[c] !== undefined).map((c) => [CATEGORY_COLUMN[c], values[c]])
  )

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

  async findByTargetAndAgent(userTargetId: string, agentId: string): Promise<AgentSale | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .select("*")
      .eq("user_target_id", userTargetId)
      .eq(AGENT_ID_COLUMN, agentId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toAgentSale(data as AgentSaleRow) : null
  },

  async create(payload: CreateAgentSaleDto): Promise<AgentSale> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .insert([
        {
          user_target_id: payload.user_target_id,
          [AGENT_ID_COLUMN]: payload.agent_id,
          ...toCategoryColumns(payload),
        },
      ])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return toAgentSale(data as AgentSaleRow)
  },

  async update(id: string, payload: UpdateAgentSaleDto): Promise<AgentSale> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agent_sales")
      .update(toCategoryColumns(payload))
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
