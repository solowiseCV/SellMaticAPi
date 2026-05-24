import axios from 'axios'
import { WhatsAppRepository } from '../repositories/whatsappRepository'
import { WhatsAppValidation } from '../validations/whatsapp.validation'
import { AddNumberResult, NumberStatusResult } from '../types/whatsapp'

const META_TOKEN = process.env.WHATSAPP_TOKEN as string
const WABA_ID = process.env.WABA_ID as string
const GRAPH_URL = 'https://graph.facebook.com/v19.0'

const metaHeaders = {
  Authorization: `Bearer ${META_TOKEN}`,
  'Content-Type': 'application/json'
}
export class WhatsAppService {

  static async addNumber(
    phoneNumber: string,
    verificationMethod: 'sms' | 'voice',
    businessId: string
  ): Promise<AddNumberResult> {

    // Clean the phone number
    const { local } = WhatsAppValidation.cleanPhoneNumber(phoneNumber)

    // Verify business exists
    const business = await WhatsAppRepository.findById(businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    let phoneNumberId: string
    try {
      const addResponse = await axios.post(
        `${GRAPH_URL}/${WABA_ID}/phone_numbers`,
        {
          cc: '234',
          phone_number: local,
          migrate_whatsapp_number: false
        },
        { headers: metaHeaders }
      )
      phoneNumberId = addResponse.data.id
    } catch (err: any) {
      const metaError = err.response?.data?.error?.message
      throw new Error(metaError || 'Failed to add phone number to WhatsApp')
    }

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

  static async verifyNumber(
    phoneNumberId: string,
    otp: string,
    businessId: string
  ): Promise<void> {

    // Verify business exists
    const business = await WhatsAppRepository.findById(businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    // Verify OTP with Meta
    try {
      await axios.post(
        `${GRAPH_URL}/${phoneNumberId}/verify_code`,
        { code: otp },
        { headers: metaHeaders }
      )
    } catch (err: any) {
      const metaError = err.response?.data?.error?.message
      throw new Error(metaError || 'Invalid verification code. Please try again.')
    }

    console.log(`OTP verified for business ${businessId}`)
  }

  static async registerNumber(
    phoneNumberId: string,
    pin: string,
    businessId: string
  ): Promise<void> {

    // Verify business exists
    const business = await WhatsAppRepository.findById(businessId)
    if (!business) {
      throw new Error('Business not found')
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
      const metaError = err.response?.data?.error?.message
      throw new Error(metaError || 'Failed to register phone number')
    }

    // Activate in database
    await WhatsAppRepository.activateBusiness(businessId, phoneNumberId)

    console.log(`🚀 Bot activated for business ${businessId}`)
  }

  // Get number status
  static async getNumberStatus(
    businessId: string
  ): Promise<NumberStatusResult> {

    const business = await WhatsAppRepository.findById(businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    if (!business.phone_number_id) {
      return { connected: false }
    }

    // Get live status from Meta
    try {
      const metaResponse = await axios.get(
        `${GRAPH_URL}/${business.phone_number_id}`,
        { headers: metaHeaders }
      )

      return {
        connected: true,
        botActive: business.bot_active,
        displayPhoneNumber: metaResponse.data.display_phone_number,
        verifiedName: metaResponse.data.verified_name,
        status: metaResponse.data.status
      }
    } catch (err: any) {
      // Number exists in DB but Meta can't find it
      return {
        connected: false,
        botActive: false
      }
    }
  }

  // Disconnect number
  static async disconnectNumber(businessId: string  ): Promise<void> {
    const business = await WhatsAppRepository.findById(businessId)
    if (!business) {
      throw new Error('Business not found')
    }

    if (!business.phone_number_id) {
      throw new Error('No number connected to this business')
    }

    // Deactivate in database
    await WhatsAppRepository.clearPhoneNumber(businessId)

    console.log(`🔌 Number disconnected for business ${businessId}`)
  }
}
export async function sendWhatsApp(phoneNumberId: string, accessToken: string, to: string, text: string) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  await axios.post(
    url,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
}


