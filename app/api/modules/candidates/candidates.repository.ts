import { createClient } from "@/utils/supabase/server"
import { adminClient } from "@/utils/supabase/admin"
import { cookies } from "next/headers"
import type { Candidates, UpdateCandidateDto } from "./candidates.types"
import type { CreateCandidateInput, ImportCandidateInput } from "./candidates.validation"

async function client() {
  return createClient(await cookies())
}

export const CandidatesRepository = {
  // Called from the unauthenticated (no Supabase session) create route, guarded
  // instead by a static API key — uses the service-role client to bypass RLS
  // since there is no user session for anon-role policies to key off of.
  async create(input: CreateCandidateInput): Promise<Candidates> {
    const { data, error } = await adminClient
      .from("candidates")
      .insert({ ...input, status: "new" })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  // Plain insert, not upsert: the candidates table has no known unique constraint
  // on email to conflict-target against. Cross-import de-duplication happens
  // client-side before rows reach here (see candidates.service.ts).
  async bulkInsert(rows: ImportCandidateInput[]): Promise<Candidates[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("candidates")
      .insert(
        rows.map(({ created_at, ...row }) =>
          // created_at is a `date` column — an empty string is invalid input,
          // so omit the key entirely and let the column default (today) apply.
          created_at ? { ...row, created_at } : row
        )
      )
      .select()
    if (error) throw new Error(error.message)
    return data
  },

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

  async update(id: string, payload: UpdateCandidateDto): Promise<Candidates> {
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
