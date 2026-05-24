import { AddNumberInput, RegisterNumberInput, VerifyNumberInput } from "../types/whatsapp"

export class WhatsAppValidation {

  static addNumber(body: any): {
    valid: boolean
    errors: string[]
    data?: AddNumberInput
  } {
    const errors: string[] = []

    if (!body.phoneNumber) {
      errors.push('Phone number is required')
    } else {
      const cleaned = body.phoneNumber.replace(/\s/g, '')
      const nigerianRegex = /^(\+?234|0)[789][01]\d{8}$/
      if (!nigerianRegex.test(cleaned)) {
        errors.push('Invalid Nigerian phone number format')
      }
    }

    if (!body.verificationMethod) {
      errors.push('Verification method is required')
    } else if (!['sms', 'voice'].includes(body.verificationMethod)) {
      errors.push('Verification method must be sms or voice')
    }



    if (errors.length > 0) return { valid: false, errors }

    return {
      valid: true,
      errors: [],
      data: {
        phoneNumber: body.phoneNumber.replace(/\s/g, ''),
        verificationMethod: body.verificationMethod
      }
    }
  }

  static verifyNumber(body: any): {
    valid: boolean
    errors: string[]
    data?: VerifyNumberInput
  } {
    const errors: string[] = []

    if (!body.phoneNumberId) {
      errors.push('Phone number ID is required')
    }

    if (!body.otp) {
      errors.push('OTP is required')
    } else if (!/^\d{6}$/.test(body.otp)) {
      errors.push('OTP must be exactly 6 digits')
    }

    if (errors.length > 0) return { valid: false, errors }

    return {
      valid: true,
      errors: [],
      data: {
        phoneNumberId: body.phoneNumberId,
        otp: body.otp
      }
    }
  }

  static registerNumber(body: any): {
    valid: boolean
    errors: string[]
    data?: RegisterNumberInput
  } {
    const errors: string[] = []

    if (!body.phoneNumberId) {
      errors.push('Phone number ID is required')
    }

    if (!body.pin) {
      errors.push('PIN is required')
    } else if (!/^\d{6}$/.test(body.pin)) {
      errors.push('PIN must be exactly 6 digits')
    }

    if (errors.length > 0) return { valid: false, errors }

    return {
      valid: true,
      errors: [],
      data: {
        phoneNumberId: body.phoneNumberId,
        pin: body.pin
      }
    }
  }

  static cleanPhoneNumber(phoneNumber: string): {
    full: string
    local: string
    display: string
  } {
    let cleaned = phoneNumber.replace(/\s/g, '')

    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1)
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1)
    }

    const local = cleaned.slice(3)
    const display = `+${cleaned.slice(0, 3)} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`

    return { full: cleaned, local, display }
  }
}