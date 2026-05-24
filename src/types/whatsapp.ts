export interface AddNumberInput {
  phoneNumber: string
  verificationMethod: 'sms' | 'voice'
}

export interface VerifyNumberInput {
  phoneNumberId: string
  otp: string
}

export interface RegisterNumberInput {
  phoneNumberId: string
  pin: string
}
export interface AddNumberResult {
  phoneNumberId: string
  message: string
}

export interface NumberStatusResult {
  connected: boolean
  botActive?: boolean
  displayPhoneNumber?: string
  verifiedName?: string
  status?: string
}
