import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import type { CreateUserSalesDto, UpdateUserSalesDto, UserSales } from "./user_sales.types"

// asService: the OptimusMarketing website reads through an API key with no
// Supabase session, so those reads use the service-role client to bypass RLS.
async function client(asService = false) {
  return asService ? adminClient : createClient(await cookies())
}

export const UserSalesRepository = {
  async findAll(asService = false): Promise<UserSales[]> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("user_sales")
      .select("*")
      .order("sales", { ascending: false })
      .order("last_name", { ascending: true })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string, asService = false): Promise<UserSales | null> {
    const supabase = await client(asService)
    const { data, error } = await supabase
      .from("user_sales")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateUserSalesDto): Promise<UserSales> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("user_sales")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateUserSalesDto): Promise<UserSales> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("user_sales")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("user_sales").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
