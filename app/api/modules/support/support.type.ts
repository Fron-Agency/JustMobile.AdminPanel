export type ConversationStatus = "open" | "closed"

export interface SupportConversation {
  id: string
  visitor_name: string | null
  visitor_email: string | null
  status: ConversationStatus
  created_at: string
}

export interface SupportMessage {
  id: string
  conversation_id: string
  sender: "visitor" | "admin"
  content: string
  created_at: string
}

export interface SupportConversationWithLastMessage extends SupportConversation {
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export interface CreateMessageDto {
  conversation_id: string
  sender: "visitor" | "admin"
  content: string
}
