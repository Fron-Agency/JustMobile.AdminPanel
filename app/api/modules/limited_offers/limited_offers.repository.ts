import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { CreateLimitedOffers, LimitedOffersDto } from "./limited_offers.type"


async function client() {
  return createClient(await cookies())
}

export const LimitedOffersRepository = {
  async findAll(): Promise<LimitedOffersDto[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("limited_offers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)

    return data ?? []
  },

  async create(
    payload: CreateLimitedOffers
  ): Promise<LimitedOffersDto> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("limited_offers")
      .insert([payload])
      .select()
      .single()

    if (error) throw new Error(error.message)

    return data
  },
}