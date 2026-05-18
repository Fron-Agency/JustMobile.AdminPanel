import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { Country, CreateCountryDto, UpdateCountryDto } from "./countries.type"

async function client() {
  return createClient(await cookies())
}

export const CountryRepository = {
  async findAll(): Promise<Country[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("name", { ascending: true })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<Country | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async create(payload: CreateCountryDto): Promise<Country> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("countries")
      .insert([payload])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, payload: UpdateCountryDto): Promise<Country> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("countries")
      .update(payload)
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await client()
    const { error } = await supabase.from("countries").delete().eq("id", id)
    if (error) throw new Error(error.message)
  },
}
