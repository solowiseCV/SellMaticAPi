import pool from '../db/pool'

export interface BusinessRecord {
  id: string
  business_name: string
  phone_number_id: string | null
  bot_active: boolean
}

export class WhatsAppRepository {

  
  static async savePendingPhoneNumber(
    businessId: string,
    phoneNumberId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE businesses 
       SET phone_number_id = $1,
           updated_at = NOW()
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
      `UPDATE businesses
       SET phone_number_id = $1,
           bot_active = true,
           updated_at = NOW()
       WHERE id = $2`,
      [phoneNumberId, businessId]
    )
  }

  // Get business by ID
  static async findById(businessId: string): Promise<BusinessRecord | null> {
    const result = await pool.query(
      `SELECT id, business_name, phone_number_id, bot_active
       FROM businesses
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
      `SELECT id, business_name, phone_number_id, bot_active
       FROM businesses
       WHERE phone_number_id = $1`,
      [phoneNumberId]
    )
    return result.rows[0] || null
  }

  // Deactivate bot (disconnect number)
  static async deactivateBusiness(businessId: string): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET bot_active = false,
           updated_at = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Clear phone number (full disconnect)
  static async clearPhoneNumber(businessId: string): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET phone_number_id = NULL,
           bot_active = false,
           updated_at = NOW()
       WHERE id = $1`,
      [businessId]
    )
  }

  // Pause bot for one conversation
static async pauseConversation(conversationId: string): Promise<void> {
  await pool.query(
    `UPDATE conversations
     SET human_takeover = true,
         takeover_at = NOW()
     WHERE id = $1`,
    [conversationId]
  )
}

// Resume bot for one conversation
static async resumeConversation(conversationId: string): Promise<void> {
  await pool.query(
    `UPDATE conversations
     SET human_takeover = false,
         takeover_resumed_at = NOW()
     WHERE id = $1`,
    [conversationId]
  )
}

// Check if conversation is in human takeover mode
static async isConversationPaused(
  conversationId: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT human_takeover FROM conversations WHERE id = $1`,
    [conversationId]
  )
  return result.rows[0]?.human_takeover || false
}

// Get conversation by ID (verify it belongs to this business)
static async findConversationById(
  conversationId: string,
  businessId: string
): Promise<any | null> {
  const result = await pool.query(
    `SELECT * FROM conversations 
     WHERE id = $1 AND business_id = $2`,
    [conversationId, businessId]
  )
  return result.rows[0] || null
}

// Global bot pause
static async pauseAllConversations(businessId: string): Promise<void> {
  await pool.query(
    `UPDATE businesses
     SET bot_active = false,
         updated_at = NOW()
     WHERE id = $1`,
    [businessId]
  )
}

// Global bot resume
static async resumeAllConversations(businessId: string): Promise<void> {
  await pool.query(
    `UPDATE businesses
     SET bot_active = true,
         updated_at = NOW()
     WHERE id = $1`,
    [businessId]
  )
}


static async countPausedConversations(
  businessId: string
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM conversations
     WHERE business_id = $1 AND human_takeover = true`,
    [businessId]
  )
  return parseInt(result.rows[0].count)
}
}

