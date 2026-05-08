import { z } from "zod"

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
})

export const updateConversationStatusSchema = z.object({
  status: z.enum(["open", "closed"]),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type UpdateConversationStatusInput = z.infer<typeof updateConversationStatusSchema>
