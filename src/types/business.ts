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
  botActive: boolean
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
