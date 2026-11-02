import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import type { Agent, CreateAgentDto, UpdateAgentDto } from "./agents.types"

// asService: the OptimusMarketing website reads through an API key with no
// Supabase session, so those reads use the service-role client to bypass RLS.
async function client(asService = false) {
  return asService ? adminClient : createClient(await cookies())
}

export const AgentsRepository = {
  async findAll(asService = false): Promise<Agent[]> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string, asService = false): Promise<Agent | null> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateAgentDto): Promise<Agent> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agents")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateAgentDto): Promise<Agent> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("agents")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  // agent_sales rows of this agent are removed by the FK's ON DELETE CASCADE.
  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("agents").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
