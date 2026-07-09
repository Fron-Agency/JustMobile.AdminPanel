import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Candidates, UpdateCandidateStatusDto } from "./candidates.types"

async function client() {
  return createClient(await cookies())
}

export const CandidatesRepository = {
  async findAll(): Promise<Candidates[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Candidates | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async updateStatus(id: string, payload: UpdateCandidateStatusDto): Promise<Candidates> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("candidates")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("candidates").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
