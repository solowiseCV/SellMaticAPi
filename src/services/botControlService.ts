import { WhatsAppRepository } from '../repositories/whatsappRepository'
import { AuthRepository } from './authRepository'

export class BotControlService {

  // Pause bot for one specific conversation
  static async pauseConversation(
    conversationId: string,
    businessId: string
  ): Promise<void> {

    // Verify conversation belongs to this business
    const conversation = await WhatsAppRepository.findConversationById(
      conversationId,
      businessId
    )

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    if (conversation.human_takeover) {
      throw new Error('Bot is already paused for this conversation')
    }

    await WhatsAppRepository.pauseConversation(conversationId)
    console.log(`Human takeover: conversation ${conversationId}`)
  }

  // Resume bot for one specific conversation
  static async resumeConversation(
    conversationId: string,
    businessId: string
  ): Promise<void> {
    const conversation = await WhatsAppRepository.findConversationById(
      conversationId,
      businessId
    )

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    if (!conversation.human_takeover) {
      throw new Error('Bot is already active for this conversation')
    }

    await WhatsAppRepository.resumeConversation(conversationId)
    console.log(`Bot resumed: conversation ${conversationId}`)
  }

  // Pause bot globally for all conversations
  static async pauseGlobal(businessId: string): Promise<void> {
    const business = await AuthRepository.findById(businessId)
    if (!business) throw new Error('Business not found')

    if (!business.bot_active) {
      throw new Error('Bot is already paused')
    }

    await WhatsAppRepository.pauseAllConversations(businessId)
    console.log(`Global bot pause: business ${businessId}`)
  }

  // Resume bot globally
  static async resumeGlobal(businessId: string): Promise<void> {
    const business = await AuthRepository.findById(businessId)
    if (!business) throw new Error('Business not found')

    if (business.bot_active) {
      throw new Error('Bot is already active')
    }

    await WhatsAppRepository.resumeAllConversations(businessId)
    console.log(`Global bot resumed: business ${businessId}`)
  }

  // Get bot status for a business
  static async getBotStatus(businessId: string): Promise<{
    globallyActive: boolean
    pausedConversations: number
  }> {
    const business = await AuthRepository.findById(businessId)
    if (!business) throw new Error('Business not found')

    const result = await WhatsAppRepository.countPausedConversations(
      businessId
    )

    return {
      globallyActive: business.bot_active,
      pausedConversations: result
    }
  }
}