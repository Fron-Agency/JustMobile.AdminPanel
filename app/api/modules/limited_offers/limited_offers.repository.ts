import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { LimitedOffersDto } from "./limited_offers.type"
import { CreateLimitedOffers } from "./limited_offers.validation"


async function client() {
  return createClient(await cookies())
}

export const LimitedOffersRepository = {
  async findAll(startDate?: string | null, endDate?: string | null): Promise<LimitedOffersDto[]> {
    const supabase = await client()

    let query = supabase
      .from("limited_offers")
      .select(`
        *,
        plans_mobile (
          name
        )
      `)

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    })

    if (error) throw new Error(error.message)

    return (
      data?.map((offer) => ({
        id: offer.id,
        plan_mobile_id: offer.plan_mobile_id,
        plan_mobile_name: offer.plans_mobile?.name ?? "",
        email: offer.email,
        time: offer.time,
        created_at: offer.created_at,
      })) ?? []
    )
  },

  async findByEmail(email: string, plan_id: string): Promise<LimitedOffersDto | null> {
    const supabase = await client()

    const { data, error } = await supabase
      .from("limited_offers")
      .select("*")
      .eq("email", email)
      .eq("plan_mobile_id", plan_id)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
      return null
    }

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