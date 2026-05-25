import pool from '../db/pool'

export interface Business {
  id: number
  business_name: string
  owner_name: string
  owner_email: string
  owner_phone: string
  password_hash: string
  email_verified: boolean
  email_verification_token: string | null
  password_reset_token: string | null
  password_reset_expires: Date | null
  plan: string
  subscription_active: boolean
  trial_ends_at: Date | null
  bot_active: boolean
  onboarding_completed: boolean
  created_at: Date
}

export interface CreateBusinessInput {
  businessName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  passwordHash: string
  emailVerificationToken: string
  trialEndsAt: Date
}

export class AuthRepository {

  // Find business by email
  static async findByEmail(email: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM businesses WHERE owner_email = $1 LIMIT 1`,
      [email]
    )
    return result.rows[0] || null
  }

  // Find business by ID
  static async findById(id: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM businesses WHERE id = $1 LIMIT 1`,
      [id]
    )
    return result.rows[0] || null
  }

  // Find by email verification token
  static async findByVerificationToken(
    token: string
  ): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM businesses 
       WHERE email_verification_token = $1 LIMIT 1`,
      [token]
    )
    return result.rows[0] || null
  }

  // Find by password reset token
  static async findByResetToken(token: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM businesses 
       WHERE password_reset_token = $1
       AND password_reset_expires > NOW()
       LIMIT 1`,
      [token]
    )
    return result.rows[0] || null
  }

  // Create new business
  static async create(input: CreateBusinessInput): Promise<Business> {
    const result = await pool.query(
      `INSERT INTO businesses (
        business_name,
        owner_name,
        owner_email,
        owner_phone,
        password_hash,
        email_verification_token,
        email_verified,
        plan,
        subscription_active,
        trial_ends_at,
        bot_active,
        onboarding_completed,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        false, 'free_trial', true,
        $7, false, false,
        NOW(), NOW()
      ) RETURNING *`,
      [
        input.businessName,
        input.ownerName,
        input.ownerEmail,
        input.ownerPhone,
        input.passwordHash,
        input.emailVerificationToken,
        input.trialEndsAt
      ]
    )
    return result.rows[0]
  }

  // Verify email
  static async verifyEmail(id: string): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET email_verified = true,
           email_verification_token = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    )
  }

  // Save password reset token
  static async saveResetToken(
    id: number,
    token: string,
    expires: Date
  ): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET password_reset_token = $1,
           password_reset_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [token, expires, id]
    )
  }

  // Clear password reset token
  static async clearResetToken(id: number): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    )
  }

  // Update password
  static async updatePassword(
    id: number,
    passwordHash: string
  ): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    )
  }

  // Save new email verification token (for resend)
  static async saveVerificationToken(
    id: number,
    token: string
  ): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET email_verification_token = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [token, id]
    )
  }

  // Update last login
  static async updateLastLogin(id: number): Promise<void> {
    await pool.query(
      `UPDATE businesses
       SET last_login_at = NOW()
       WHERE id = $1`,
      [id]
    )
  }
}