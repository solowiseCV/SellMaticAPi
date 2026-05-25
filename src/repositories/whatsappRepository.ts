import pool from '../db/pool'
import { BusinessRecord } from '../types/business'

export class WhatsAppRepository {

  // Save phone number before full activation
  static async savePendingPhoneNumber(
    businessId: string,
    phoneNumberId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business" 
       SET "phoneNumberId" = $1,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [phoneNumberId, businessId]
    )
  }

  // Activate bot after number is fully registered
  static async activateBusiness(
    businessId: string,
    phoneNumberId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "phoneNumberId" = $1,
           "botActive" = true,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [phoneNumberId, businessId]
    )
  }

  // Get business by ID
  static async findById(
    businessId: string
  ): Promise<BusinessRecord | null> {
    const result = await pool.query(
      `SELECT 
          id,
          "businessName",
          "phoneNumberId",
          "botActive"
       FROM "Business"
       WHERE id = $1`,
      [businessId]
    )

    return result.rows[0] || null
  }

  // Get business by phone number ID
  static async findByPhoneNumberId(
    phoneNumberId: string
  ): Promise<BusinessRecord | null> {
    const result = await pool.query(
      `SELECT 
          id,
          "businessName",
          "phoneNumberId",
          "botActive"
       FROM "Business"
       WHERE "phoneNumberId" = $1`,
      [phoneNumberId]
    )

    return result.rows[0] || null
  }

  // Deactivate bot (disconnect number)
  static async deactivateBusiness(
    businessId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "botActive" = false,
           "updatedAt" = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Clear phone number (full disconnect)
  static async clearPhoneNumber(
    businessId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "phoneNumberId" = NULL,
           "botActive" = false,
           "updatedAt" = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Pause bot for one conversation
  static async pauseConversation(
    conversationId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Conversation"
       SET "humanTakeover" = true,
           "takeoverAt" = NOW()
       WHERE id = $1`,
      [conversationId]
    )
  }

  // Resume bot for one conversation
  static async resumeConversation(
    conversationId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Conversation"
       SET "humanTakeover" = false,
           "takeoverResumedAt" = NOW()
       WHERE id = $1`,
      [conversationId]
    )
  }

  // Check if conversation is in human takeover mode
  static async isConversationPaused(
    conversationId: string
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT "humanTakeover"
       FROM "Conversation"
       WHERE id = $1`,
      [conversationId]
    )

    return result.rows[0]?.humanTakeover ?? false
  }

  // Get conversation by ID and verify ownership
  static async findConversationById(
    conversationId: string,
    businessId: string
  ): Promise<any | null> {
    const result = await pool.query(
      `SELECT *
       FROM "Conversation"
       WHERE id = $1
       AND "businessId" = $2`,
      [conversationId, businessId]
    )

    return result.rows[0] || null
  }

  // Pause all conversations globally
  static async pauseAllConversations(
    businessId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "botActive" = false,
           "updatedAt" = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Resume all conversations globally
  static async resumeAllConversations(
    businessId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "botActive" = true,
           "updatedAt" = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Count paused conversations
  static async countPausedConversations(
    businessId: string
  ): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM "Conversation"
       WHERE "businessId" = $1
       AND "humanTakeover" = true`,
      [businessId]
    )

    return result.rows[0]?.count ?? 0
  }
}