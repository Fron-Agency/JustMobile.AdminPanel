import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Plan, CreatePlanDto, UpdatePlanInput } from "./plans.type"

async function client() {
  return createClient(await cookies())
}

export const PlanRepository = {
  async findAll(): Promise<Plan[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Plan | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreatePlanDto): Promise<Plan> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdatePlanInput): Promise<Plan> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("plans")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("plans").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}