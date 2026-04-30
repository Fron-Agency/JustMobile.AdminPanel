import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { User, CreateUserDto, UpdateUserDto } from "./users.type"

async function client() {
  return createClient(await cookies())
}

export const UserRepository = {
  async findAll(): Promise<User[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<User | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateUserDto): Promise<User> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("users")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("users")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}