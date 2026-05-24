import { PoolClient } from 'pg'
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
}