import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { SupportConversation, SupportMessage, CreateMessageDto } from "./support.type"

async function client() {
  return createClient(await cookies())
}

export const SupportRepository = {
  async findAllConversations(): Promise<SupportConversation[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  async findById(id: string): Promise<SupportConversation | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },

  async updateStatus(id: string, status: string): Promise<SupportConversation> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("support_conversations")
      .update({ status })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async findMessages(conversationId: string): Promise<SupportMessage[]> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (error) throw new Error(error.message)
    return data
  },

  async createMessage(payload: CreateMessageDto): Promise<SupportMessage> {
    const supabase = await client()
    const { data, error } = await supabase
      .from("support_messages")
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },
}
