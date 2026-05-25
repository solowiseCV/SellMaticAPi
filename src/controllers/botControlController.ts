import { Response } from 'express'
import { BotControlService } from '../services/botControlService'
import { AuthenticatedRequest } from '../middlewares/authMiddleware'

export class BotControlController {

  static async pauseConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const conversationId = req.params.conversationId as string
    const businessId = req.businessId!

    try {
      await BotControlService.pauseConversation(conversationId, businessId)
      res.status(200).json({
        success: true,
        message: 'Bot paused for this conversation. You can now reply manually.'
      })
    } catch (err: any) {
      console.error('Pause conversation error:', err.message)
      res.status(400).json({
        success: false,
        error: err.message
      })
    }
  }

  static async resumeConversation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    const conversationId = req.params.conversationId   as string 
    const businessId = req.businessId!

    try {
      await BotControlService.resumeConversation(conversationId, businessId)
      res.status(200).json({
        success: true,
        message: 'Bot resumed for this conversation.'
      })
    } catch (err: any) {
      console.error('Resume conversation error:', err.message)
      res.status(400).json({
        success: false,
        error: err.message
      })
    }
  }

  static async pauseGlobal(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      await BotControlService.pauseGlobal(req.businessId!)
      res.status(200).json({
        success: true,
        message: 'Bot paused for all conversations.'
      })
    } catch (err: any) {
      console.error('Global pause error:', err.message)
      res.status(400).json({
        success: false,
        error: err.message
      })
    }
  }

  static async resumeGlobal(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      await BotControlService.resumeGlobal(req.businessId!)
      res.status(200).json({
        success: true,
        message: 'Bot resumed for all conversations.'
      })
    } catch (err: any) {
      console.error('Global resume error:', err.message)
      res.status(400).json({
        success: false,
        error: err.message
      })
    }
  }

  static async getBotStatus(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const status = await BotControlService.getBotStatus(req.businessId!)
      res.status(200).json({ success: true, ...status })
    } catch (err: any) {
      console.error('Bot status error:', err.message)
      res.status(500).json({
        success: false,
        error: err.message
      })
    }
  }
}