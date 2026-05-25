
import { Request, Response } from 'express'
import pool from '../db/pool'
import { FALLBACK_PHONE_NUMBER_ID, FALLBACK_WHATSAPP_TOKEN, VERIFY_TOKEN } from '../config/env'
import { buildBusinessContext } from '../services/businessContext'
import { generateAssistantResponse } from '../services/openaiService'
import { sendWhatsApp } from '../services/whatsappService'
import { getBusinessByPhoneNumberId } from '../repositories/businessRepository'
import { upsertConversation, getRecentMessages, isConversationPaused } from '../repositories/conversationRepository'
import { saveMessage } from '../repositories/messageRepository'
import { WebhookBody } from '../types/webhook'

// export function handleWebhookVerification(req: Request, res: Response) {
//   const mode = req.query['hub.mode'] as string
//   const token = req.query['hub.verify_token'] as string
//   const challenge = req.query['hub.challenge'] as string

//   if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//     res.status(200).send(challenge)
//   } else {
//     res.sendStatus(403)
//   }
// }

// export async function handleIncomingWebhook(req: Request, res: Response) {
//   res.status(200).json({ received: true })
//   const body = req.body as WebhookBody

//   if (!body.entry) return

//   for (const entry of body.entry) {
//     const change = entry.changes?.[0]
//     const value = change?.value
//     const phoneNumberId = value?.metadata?.phone_number_id || FALLBACK_PHONE_NUMBER_ID

//     const messages = value?.messages || []
//     for (const msg of messages) {
//       if (!msg.text?.body) continue

//       const client = await pool.connect()
//       try {
//         await client.query('BEGIN')

//         //  Find business
//         const business = await getBusinessByPhoneNumberId(client, phoneNumberId)
//         if (!business) {
//           console.warn('No business found for phoneNumberId', phoneNumberId)
//           await client.query('ROLLBACK')
//           continue
//         }

//         //  Get or create conversation
//         const conversationId = await upsertConversation(client, business.id, msg.from)

//         // Check if human has taken over this conversation
//         const paused = await isConversationPaused(client, conversationId)
//         if (paused) {
//           console.log(`Human takeover active for conversation ${conversationId} — saving message, skipping AI reply`)
//           await saveMessage(client, conversationId, 'user', msg.text.body)
//           await client.query('COMMIT')
//           continue 
//         }

//         // Save customer message
//         await saveMessage(client, conversationId, 'user', msg.text.body)

//         //  Generate AI response
//         const recent = await getRecentMessages(client, conversationId, 10)
//         const businessContext = buildBusinessContext(business)
//         const assistantText = await generateAssistantResponse(businessContext, recent)

//         // Save AI reply
//         await saveMessage(client, conversationId, 'assistant', assistantText)

//         //  Send reply via WhatsApp
//         const accessToken = business.accessToken || FALLBACK_WHATSAPP_TOKEN
//         const sendPhoneNumberId = business.phoneNumberId || FALLBACK_PHONE_NUMBER_ID

//         try {
//           await sendWhatsApp(sendPhoneNumberId, accessToken, msg.from, assistantText)
//         } catch (err) {
//           console.error('WhatsApp send error', err)
//         }

//         await client.query('COMMIT')
//       } catch (err) {
//         await client.query('ROLLBACK')
//         console.error('Processing error', err)
//       } finally {
//         client.release()
//       }
//     }
//   }
// }


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

  if (!body.entry) {
    console.log('⚠️ No entry in webhook body')
    return
  }

  for (const entry of body.entry) {
    const change = entry.changes?.[0]
    const value = change?.value
    const phoneNumberId = value?.metadata?.phone_number_id || FALLBACK_PHONE_NUMBER_ID

    console.log(`📨 Webhook received — phoneNumberId: ${phoneNumberId}`)

    const messages = value?.messages || []

    if (messages.length === 0) {
      console.log('⚠️ No messages in payload — likely a status update, ignoring')
      continue
    }

    for (const msg of messages) {
      if (!msg.text?.body) {
        console.log('⚠️ Message has no text body — ignoring')
        continue
      }

      console.log(`📩 Message from ${msg.from}: ${msg.text.body}`)

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Step 1 — Find business
        console.log(`🔍 Looking up business for phoneNumberId: ${phoneNumberId}`)
        const business = await getBusinessByPhoneNumberId(client, phoneNumberId)
        if (!business) {
          console.warn(`❌ No business found for phoneNumberId: ${phoneNumberId}`)
          await client.query('ROLLBACK')
          continue
        }
        console.log(`✅ Business found: ${business.businessName}`)

        // Step 2 — Get or create conversation
        console.log(`💬 Upserting conversation for ${msg.from}`)
        const conversationId = await upsertConversation(client, business.id, msg.from)
        console.log(`✅ Conversation ID: ${conversationId}`)

        // Step 3 — Check human takeover
        const paused = await isConversationPaused(client, conversationId)
        if (paused) {
          console.log(`⏸️ Human takeover active — saving message, skipping AI reply`)
          await saveMessage(client, conversationId, 'user', msg.text.body)
          await client.query('COMMIT')
          continue
        }

        // Step 4 — Save customer message
        await saveMessage(client, conversationId, 'user', msg.text.body)
        console.log(`✅ Customer message saved`)

        // Step 5 — Generate AI response
        console.log(`🤖 Calling OpenAI...`)
        const recent = await getRecentMessages(client, conversationId, 10)
        const businessContext = buildBusinessContext(business)
        const assistantText = await generateAssistantResponse(businessContext, recent)
        console.log(`✅ AI response: ${assistantText.slice(0, 80)}...`)

        // Step 6 — Save AI reply
        await saveMessage(client, conversationId, 'assistant', assistantText)
        console.log(`✅ AI reply saved`)

        // Step 7 — Send via WhatsApp
        console.log(`📤 Sending reply to ${msg.from}...`)
        const accessToken = business.accessToken || FALLBACK_WHATSAPP_TOKEN
        const sendPhoneNumberId = business.phoneNumberId || FALLBACK_PHONE_NUMBER_ID

        try {
          await sendWhatsApp(sendPhoneNumberId, accessToken, msg.from, assistantText)
          console.log(`✅ Reply sent to ${msg.from}`)
        } catch (err: any) {
          console.error(`❌ WhatsApp send error:`, err.response?.data || err.message)
        }

        await client.query('COMMIT')
        console.log(`✅ Transaction committed successfully`)

      } catch (err: any) {
        await client.query('ROLLBACK')
        console.error(`❌ Processing error:`, err.message)
        console.error(err.stack)
      } finally {
        client.release()
      }
    }
  }
}