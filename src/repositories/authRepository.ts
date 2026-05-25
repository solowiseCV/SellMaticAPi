
import pool from '../db/pool'
import { Business, CreateBusinessInput } from '../types/business'



export class AuthRepository {

  // Find business by email
  static async findByEmail(email: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM "Business" 
       WHERE "ownerEmail" = $1 
       LIMIT 1`,
      [email]
    )
    return result.rows[0] || null
  }

  // Find business by ID
  static async findById(id: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM "Business" 
       WHERE id = $1::uuid 
       LIMIT 1`,
      [id]
    )
    return result.rows[0] || null
  }

  // Find by email verification token
  static async findByVerificationToken(
    token: string
  ): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM "Business" 
       WHERE "emailVerificationToken" = $1 
       LIMIT 1`,
      [token]
    )
    return result.rows[0] || null
  }

  // Find by password reset token (only valid unexpired tokens)
  static async findByResetToken(token: string): Promise<Business | null> {
    const result = await pool.query(
      `SELECT * FROM "Business" 
       WHERE "passwordResetToken" = $1
       AND "passwordResetExpires" > NOW()
       LIMIT 1`,
      [token]
    )
    return result.rows[0] || null
  }

  // Create new business
  static async create(input: CreateBusinessInput): Promise<Business> {
    const result = await pool.query(
      `INSERT INTO "Business" (
        "businessName",
        "ownerName",
        "ownerEmail",
        "ownerPhone",
        "password",
        "emailVerificationToken",
        "emailVerified",
        "plan",
        "subscriptionActive",
        "trialEndsAt",
        "botActive",
        "onboardingCompleted",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        false,
        'free_trial',
        true,
        $7,
        true,
        false,
        NOW(),
        NOW()
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

  // Verify email — clear token, mark verified
  static async verifyEmail(id: string): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "emailVerified" = true,
           "emailVerificationToken" = NULL,
           "updatedAt" = NOW()
       WHERE id = $1::uuid`,
      [id]
    )
  }

  // Save password reset token + expiry
  static async saveResetToken(
    id: string,
    token: string,
    expires: Date
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "passwordResetToken" = $1,
           "passwordResetExpires" = $2,
           "updatedAt" = NOW()
       WHERE id = $3::uuid`,
      [token, expires, id]
    )
  }

  // Clear password reset token after use
  static async clearResetToken(id: string): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "passwordResetToken" = NULL,
           "passwordResetExpires" = NULL,
           "updatedAt" = NOW()
       WHERE id = $1::uuid`,
      [id]
    )
  }

  // Update password + clear reset token in one query
  static async updatePassword(
    id: string,
    passwordHash: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "password" = $1,
           "passwordResetToken" = NULL,
           "passwordResetExpires" = NULL,
           "updatedAt" = NOW()
       WHERE id = $2::uuid`,
      [passwordHash, id]
    )
  }

  // Save new verification token (for resend)
  static async saveVerificationToken(
    id: string,
    token: string
  ): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "emailVerificationToken" = $1,
           "updatedAt" = NOW()
       WHERE id = $2::uuid`,
      [token, id]
    )
  }

  // Update last login timestamp
  static async updateLastLogin(id: string): Promise<void> {
    await pool.query(
      `UPDATE "Business"
       SET "lastLoginAt" = NOW()
       WHERE id = $1::uuid`,
      [id]
    )
  }

  // Check if email already exists
  static async emailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM "Business" 
       WHERE "ownerEmail" = $1 
       LIMIT 1`,
      [email]
    )
    return result.rows.length > 0
  }
}