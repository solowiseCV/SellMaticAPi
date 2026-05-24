import { Request, Response } from 'express'
import pool from '../db/pool'
import { FALLBACK_PHONE_NUMBER_ID, FALLBACK_WHATSAPP_TOKEN, VERIFY_TOKEN } from '../config/env'
import { buildBusinessContext } from '../services/businessContext'
import { generateAssistantResponse } from '../services/openaiService'
import { sendWhatsApp } from '../services/whatsappService'
import { getBusinessByPhoneNumberId } from '../repositories/businessRepository'
import { upsertConversation, getRecentMessages } from '../repositories/conversationRepository'
import { saveMessage } from '../repositories/messageRepository'
import { WebhookBody } from '../types/webhook'

export function handleWebhookVerification(req: Request, res: Response) {
  const mode = req.query['hub.mode'] as string
  const token = req.query['hub.verify_token'] as string
  const challenge = req.query['hub.challenge'] as string

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
}

export async function handleIncomingWebhook(req: Request, res: Response) {
  res.status(200).json({ received: true })
  const body = req.body as WebhookBody

  if (!body.entry) return

  for (const entry of body.entry) {
    const change = entry.changes?.[0]
    const value = change?.value
    const phoneNumberId = value?.metadata?.phone_number_id || FALLBACK_PHONE_NUMBER_ID

    const messages = value?.messages || []
    for (const msg of messages) {
      if (!msg.text?.body) continue

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const business = await getBusinessByPhoneNumberId(client, phoneNumberId)
        if (!business) {
          console.warn('No business found for phoneNumberId', phoneNumberId)
          await client.query('ROLLBACK')
          continue
        }

        const conversationId = await upsertConversation(client, business.id, msg.from)
        await saveMessage(client, conversationId, 'user', msg.text.body)

        const recent = await getRecentMessages(client, conversationId, 10)
        const businessContext = buildBusinessContext(business)
        const assistantText = await generateAssistantResponse(businessContext, recent)

        await saveMessage(client, conversationId, 'assistant', assistantText)

        const accessToken = business.accessToken || FALLBACK_WHATSAPP_TOKEN
        const sendPhoneNumberId = business.phoneNumberId || FALLBACK_PHONE_NUMBER_ID

        try {
          await sendWhatsApp(sendPhoneNumberId, accessToken, msg.from, assistantText)
        } catch (err) {
          console.error('WhatsApp send error', err)
        }

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        console.error('Processing error', err)
      } finally {
        client.release()
      }
    }
  }
}
