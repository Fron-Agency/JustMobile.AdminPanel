import { SupportRepository } from "./support.repository"
import type { SupportConversation, SupportMessage, CreateMessageDto } from "./support.type"

export const SupportService = {
  async getConversations(): Promise<SupportConversation[]> {
    return SupportRepository.findAllConversations()
  },

  async getById(id: string): Promise<SupportConversation> {
    const conv = await SupportRepository.findById(id)
    if (!conv) throw new Error("Conversation not found")
    return conv
  },

  async updateStatus(id: string, status: string): Promise<SupportConversation> {
    await SupportService.getById(id)
    return SupportRepository.updateStatus(id, status)
  },

  async getMessages(conversationId: string): Promise<SupportMessage[]> {
    await SupportService.getById(conversationId)
    return SupportRepository.findMessages(conversationId)
  },

  async sendMessage(payload: CreateMessageDto): Promise<SupportMessage> {
    await SupportService.getById(payload.conversation_id)
    return SupportRepository.createMessage(payload)
  },
}
