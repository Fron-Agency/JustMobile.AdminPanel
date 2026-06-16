import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { LimitedOffersDto } from "./limited_offers.type"
import { CreateLimitedOffers } from "./limited_offers.validation"


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

  async findByEmail(email: string): Promise<LimitedOffersDto> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("limited_offers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if(error) throw new Error(error.message);

    return {
      ...data,
      time: new Date(data.time).toLocaleString("de-CH", {
        timeZone: "Europe/Zurich",
      }),
      created_at: new Date(data.created_at).toLocaleString("de-CH", {
        timeZone: "Europe/Zurich",
      }),
    }
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

    return {
      ...data,
      time: new Date(data.time).toLocaleString("de-CH", {
        timeZone: "Europe/Zurich",
      }),
      created_at: new Date(data.created_at).toLocaleString("de-CH", {
        timeZone: "Europe/Zurich",
      }),
    }
  },
}