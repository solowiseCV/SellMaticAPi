import { Response } from 'express'
import { WhatsAppService } from '../services/whatsappService'
import { WhatsAppValidation } from '../validations/whatsapp.validation'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'

export class WhatsAppController {

  static async addNumber(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const businessId = req.businessId !

    const validation = WhatsAppValidation.addNumber(req.body)
    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors })
      return
    }
    
    try {
      const result = await WhatsAppService.addNumber(
        validation.data!.phoneNumber,
        validation.data!.verificationMethod,
        businessId  
      )

      res.status(200).json({
        success: true,
        phoneNumberId: result.phoneNumberId,
        message: result.message
      })
    } catch (err: any) {
      console.error('addNumber error:', err.message)
      res.status(500).json({
        success: false,
        error: err.message || 'Something went wrong. Please try again.'
      })
    }
  }

  static async verifyNumber(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const businessId = req.businessId!

    const validation = WhatsAppValidation.verifyNumber(req.body)
    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors })
      return
    }

    try {
      await WhatsAppService.verifyNumber(
        validation.data!.phoneNumberId,
        validation.data!.otp,
        businessId  
      )

      res.status(200).json({
        success: true,
        message: 'Number verified successfully'
      })
    } catch (err: any) {
      console.error('verifyNumber error:', err.message)
      res.status(400).json({
        success: false,
        error: err.message || 'Invalid verification code.'
      })
    }
  }

  static async registerNumber(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const businessId = req.businessId!

    const validation = WhatsAppValidation.registerNumber(req.body)
    if (!validation.valid) {
      res.status(400).json({ success: false, errors: validation.errors })
      return
    }

    try {
      await WhatsAppService.registerNumber(
        validation.data!.phoneNumberId,
        validation.data!.pin,
        businessId  
      )

      res.status(200).json({
        success: true,
        message: 'WhatsApp number connected. Your bot is now live!'
      })
    } catch (err: any) {
      console.error('registerNumber error:', err.message)
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to register number.'
      })
    }
  }

  static async getNumberStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const businessId = req.businessId!

    try {
      const status = await WhatsAppService.getNumberStatus(businessId)
      res.status(200).json({ success: true, ...status })
    } catch (err: any) {
      console.error('getNumberStatus error:', err.message)
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to get number status'
      })
    }
  }

  static async disconnectNumber(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const businessId = req.businessId!

    try {
      await WhatsAppService.disconnectNumber(businessId)
      res.status(200).json({
        success: true,
        message: 'WhatsApp number disconnected successfully'
      })
    } catch (err: any) {
      console.error('disconnectNumber error:', err.message)
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to disconnect number'
      })
    }
  }
}