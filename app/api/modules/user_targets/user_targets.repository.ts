import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import type { CreateUserTargetDto, UpdateUserTargetDto, UserTarget } from "./user_targets.types"

// asService: the OptimusMarketing website reads through an API key with no
// Supabase session, so those reads use the service-role client to bypass RLS.
async function client(asService = false) {
  return asService ? adminClient : createClient(await cookies())
}

// `numeric` can come back as a string; keep `target` a number for callers.
const normalize = (row: UserTarget): UserTarget => ({ ...row, target: Number(row.target) })

export const UserTargetsRepository = {
  async findAll(asService = false): Promise<UserTarget[]> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("user_targets")
      .select("*")
      .order("start_date", { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(normalize)
  },

  async findById(id: string, asService = false): Promise<UserTarget | null> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("user_targets")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? normalize(data) : null
  },

  async create(payload: CreateUserTargetDto): Promise<UserTarget> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("user_targets")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return normalize(data)
  },

  async update(id: string, payload: UpdateUserTargetDto): Promise<UserTarget> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("user_targets")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return normalize(data)
  },

  // agent_sales rows of this target are removed by the FK's ON DELETE CASCADE.
  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("user_targets").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
