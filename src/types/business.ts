


export interface BusinessRecord {
  id: string
  businessName: string
  phoneNumberId: string | null
  botActive: boolean
}


export interface Business {
  id: string
  businessName: string
  ownerName: string
  ownerEmail: string
  password: string
  ownerPhone: string
  phoneNumberId: string | null
  wabaId: string | null
  accessToken: string | null
  location: string | null
  deliveryInfo: string | null
  paymentInfo: string | null
  businessDescription: string | null
  products: any[]
  botActive: boolean
  botPersonality: string
  plan: string
  trialEndsAt: Date | null
  subscriptionActive: boolean
  emailVerified: boolean
  emailVerificationToken: string | null
  passwordResetToken: string | null
  passwordResetExpires: Date | null
  onboardingCompleted: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
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