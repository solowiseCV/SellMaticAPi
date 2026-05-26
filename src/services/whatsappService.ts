import axios from 'axios'
import { WhatsAppRepository } from '../repositories/whatsappRepository'
import { WhatsAppValidation } from '../validations/whatsapp.validation'
import { AddNumberResult, NumberStatusResult } from '../types/whatsapp'

// Validate environment variables
if (!process.env.WHATSAPP_TOKEN) {
  throw new Error('WHATSAPP_TOKEN is missing in environment variables')
}

if (!process.env.WABA_ID) {
  throw new Error('WABA_ID is missing in environment variables')
}

const META_TOKEN = process.env.WHATSAPP_TOKEN
const WABA_ID = process.env.WABA_ID

const GRAPH_URL = 'https://graph.facebook.com/v20.0'

const metaHeaders = {
  Authorization: `Bearer ${META_TOKEN}`,
  'Content-Type': 'application/json'
}

export class WhatsAppService {

  // Add phone number to Meta
 static async addNumber(
  phoneNumber: string,
  verificationMethod: 'sms' | 'voice',
  businessId: string
): Promise<AddNumberResult> {

  const { local } = WhatsAppValidation.cleanPhoneNumber(phoneNumber)

  const business = await WhatsAppRepository.findById(businessId)
  if (!business) {
    throw new Error('Business not found')
  }

  console.log(`📞 Adding number for business ${business}: ${local}`)

  // Step 1a — Add number to WABA
   // Step 1a — Add number to WABA
let phoneNumberId: string
try {
  const addResponse = await axios.post(
    `${GRAPH_URL}/${WABA_ID}/phone_numbers`,
    {
      cc: '234',
      phone_number: local,
      migrate_whatsapp_number: false,
      verified_name: business.businessName
    },
    { headers: metaHeaders }
  )
  phoneNumberId = addResponse.data.id
} catch (err: any) {
  // Log the FULL Meta error response
  console.error('Meta add number full error:', JSON.stringify(err.response?.data, null, 2))
  console.error('Meta error status:', err.response?.status)
  console.error('Meta error headers:', err.response?.headers)
  
  const metaError = err.response?.data?.error?.message
  const metaCode = err.response?.data?.error?.code
  const metaSubcode = err.response?.data?.error?.error_subcode
  
  throw new Error(
    `Meta Error ${metaCode}/${metaSubcode}: ${metaError || 'Unknown error'}`
  )
}

  // Step 1b — Request OTP
  try {
    await axios.post(
      `${GRAPH_URL}/${phoneNumberId}/request_code`,
      {
        code_method: verificationMethod === 'sms' ? 'SMS' : 'VOICE',
        language: 'en_US'
      },
      { headers: metaHeaders }
    )
  } catch (err: any) {
    const metaError = err.response?.data?.error?.message
    throw new Error(metaError || 'Failed to send verification code')
  }

  await WhatsAppRepository.savePendingPhoneNumber(businessId, phoneNumberId)

  console.log(`📱 Number added for business ${businessId}: ${phoneNumberId}`)

  return {
    phoneNumberId,
    message: 'Verification code sent successfully'
  }
}

  // Verify OTP
  static async verifyNumber(
    phoneNumberId: string,
    otp: string,
    businessId: string
  ): Promise<void> {

    // Verify business exists
    const business =
      await WhatsAppRepository.findById(businessId)

    if (!business) {
      throw new Error('Business not found')
    }

    // Ensure number belongs to business
    if (business.phoneNumberId !== phoneNumberId) {
      throw new Error('Invalid phone number for this business')
    }

    // Verify OTP with Meta
    try {
      await axios.post(
        `${GRAPH_URL}/${phoneNumberId}/verify_code`,
        { code: otp },
        { headers: metaHeaders }
      )

    } catch (err: any) {

      const metaError =
        axios.isAxiosError(err)
          ? err.response?.data?.error?.message
          : null

      throw new Error(
        metaError ||
        'Invalid verification code. Please try again.'
      )
    }

    console.log(
      `✅ OTP verified for business ${businessId}`
    )
  }

  // Register number with PIN
  static async registerNumber(
    phoneNumberId: string,
    pin: string,
    businessId: string
  ): Promise<void> {

    // Verify business exists
    const business =
      await WhatsAppRepository.findById(businessId)

    if (!business) {
      throw new Error('Business not found')
    }

    // Ensure number belongs to business
    if (business.phoneNumberId !== phoneNumberId) {
      throw new Error('Invalid phone number for this business')
    }

    // Register with Meta
    try {
      await axios.post(
        `${GRAPH_URL}/${phoneNumberId}/register`,
        {
          messaging_product: 'whatsapp',
          pin
        },
        { headers: metaHeaders }
      )

    } catch (err: any) {

      const metaError =
        axios.isAxiosError(err)
          ? err.response?.data?.error?.message
          : null

      throw new Error(
        metaError || 'Failed to register phone number'
      )
    }

    // Activate bot in database
    await WhatsAppRepository.activateBusiness(
      businessId,
      phoneNumberId
    )

    console.log(
      `🚀 Bot activated for business ${businessId}`
    )
  }

  // Get live WhatsApp number status
  static async getNumberStatus(
    businessId: string
  ): Promise<NumberStatusResult> {

    const business =
      await WhatsAppRepository.findById(businessId)

    if (!business) {
      throw new Error('Business not found')
    }

    if (!business.phoneNumberId) {
      return {
        connected: false
      }
    }

    // Fetch live status from Meta
    try {

      const metaResponse = await axios.get(
        `${GRAPH_URL}/${business.phoneNumberId}`,
        { headers: metaHeaders }
      )

      return {
        connected: true,
        botActive: business.botActive,
        displayPhoneNumber:
          metaResponse.data.display_phone_number,

        verifiedName:
          metaResponse.data.verified_name,

        status:
          metaResponse.data.status
      }

    } catch (err) {

      // Number exists locally but Meta failed
      return {
        connected: false,
        botActive: false
      }
    }
  }

  // Disconnect WhatsApp number
  static async disconnectNumber(
    businessId: string
  ): Promise<void> {

    const business =
      await WhatsAppRepository.findById(businessId)

    if (!business) {
      throw new Error('Business not found')
    }

    if (!business.phoneNumberId) {
      throw new Error(
        'No number connected to this business'
      )
    }

    // Remove number from DB
    await WhatsAppRepository.clearPhoneNumber(
      businessId
    )

    console.log(
      `🔌 Number disconnected for business ${businessId}`
    )
  }
}

// Send WhatsApp message
export async function sendWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<void> {

  const url =
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`

  try {

    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err: any) {

    const metaError =
      axios.isAxiosError(err)
        ? err.response?.data?.error?.message
        : null

    throw new Error(
      metaError || 'Failed to send WhatsApp message'
    )
  }
}