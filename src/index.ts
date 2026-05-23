import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import axios from 'axios'
import OpenAI from 'openai'
import pool from './db/pool'

dotenv.config()

const app = express()
app.use(express.json())

const FALLBACK_WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN as string
const FALLBACK_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID as string
const VERIFY_TOKEN = process.env.VERIFY_TOKEN as string
const PORT = process.env.PORT || 1999

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Types
interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text?: { body: string }
}

interface WebhookChangeValue {
  metadata?: { phone_number_id?: string }
  messages?: WhatsAppMessage[]
}

interface WebhookEntryChange {
  value?: WebhookChangeValue
}

interface WebhookEntry {
  changes?: WebhookEntryChange[]
}

interface WebhookBody {
  object?: string
  entry?: WebhookEntry[]
}

// Helpers
function buildBusinessContext(business: any): string {
  const products = Array.isArray(business.products)
    ? business.products
    : typeof business.products === 'string'
    ? JSON.parse(business.products)
    : []

  const productList = (products || [])
    .map((p: any) => `- ${p.name || p.product_name} — ₦${p.price || 0}`)
    .join('\n')

  return `You are a friendly and professional WhatsApp sales assistant for ${business.businessName}.

Personality: ${business.botPersonality || 'friendly and professional'}

Business Information:
- Name: ${business.businessName}
- Location: ${business.location || 'Not specified'}
- Delivery: ${business.deliveryInfo || 'Not specified'}
- Payment: ${business.paymentInfo || 'Not specified'}

Products:\n${productList || 'No product list available'}

Rules:\n- Only answer questions related to this business\n- If a customer wants to order, ask for: their name, item, size/quantity, and delivery address\n- If you don't know something, say \"Let me check that for you and get back to you shortly\"\n- Never make up prices or products not listed above\n- Always end with a question to keep the conversation going`
}

async function getBusinessByPhoneNumberId(client: any, phoneNumberId: string) {
  const res = await client.query(
    `SELECT id, "businessName", location, "deliveryInfo", "paymentInfo", products, "botPersonality", "accessToken", "phoneNumberId"
     FROM "Business" WHERE "phoneNumberId" = $1 AND "botActive" = true LIMIT 1`,
    [phoneNumberId]
  )
  return res.rows[0] || null
}

async function upsertConversation(client: any, businessId: number, customerPhone: string) {
  const res = await client.query(
    `INSERT INTO "Conversation" ("businessId", "customerPhone", "createdAt", "lastMessageAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT ("businessId", "customerPhone") DO UPDATE SET "lastMessageAt" = NOW()
     RETURNING id`,
    [businessId, customerPhone]
  )
  return res.rows[0].id
}

async function saveMessage(client: any, conversationId: number, role: string, content: string) {
  await client.query(
    `INSERT INTO "Message" ("conversationId", role, content, "createdAt") VALUES ($1, $2, $3, NOW())`,
    [conversationId, role, content]
  )
}

async function getRecentMessages(client: any, conversationId: number, limit = 10) {
  const res = await client.query(
    `SELECT role, content FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [conversationId, limit]
  )
  // return in chronological order
  return res.rows.reverse().map((r: any) => ({ role: r.role, content: r.content }))
}

async function generateAssistantResponse(businessContext: string, recentMessages: any[]) {
  const messages = [
    { role: 'system', content: businessContext },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content }))
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 300,
    temperature: 0.7
  })

  return response.choices?.[0]?.message?.content || 'Sorry, I could not process that.'
}

async function sendWhatsApp(phoneNumberId: string, accessToken: string, to: string, text: string) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  await axios.post(
    url,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
}

// Webhook verification
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string
  const token = req.query['hub.verify_token'] as string
  const challenge = req.query['hub.challenge'] as string

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

// Incoming messages
app.post('/webhook', async (req: Request, res: Response) => {
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
          // client.release()
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
})

export default app

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, () => console.log(`SellMatic webhook running on port ${PORT}`))
}
