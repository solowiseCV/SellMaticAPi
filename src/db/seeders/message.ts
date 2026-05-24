import type { PoolClient } from 'pg'

const userMessages = [
  'Hello, do you have this item in stock?',
  'How much is delivery to Lagos Island?',
  'Can I place an order for tomorrow?',
  'Do you offer any discount for bulk orders?',
  'What sizes are available for this product?',
  'Do you ship outside Lagos?'
]

const assistantMessages = [
  'Yes, this item is currently in stock. Which color do you prefer?',
  'Delivery to Lagos Island takes 1-2 days and costs ₦1,500.',
  'Absolutely, you can place your order now and we will confirm availability.',
  'We offer 10% off orders above ₦10,000. Would you like to proceed?',
  'We have sizes S, M, L, and XL. Which one would you like?',
  'Yes, we ship nationwide. Can I get your delivery address?'
]

async function seedMessages(client: PoolClient, conversationIds: string[]): Promise<number> {
  let messageCount = 0

  for (const conversationId of conversationIds) {
    for (let i = 0; i < 6; i += 1) {
      const role = i % 2 === 0 ? 'user' : 'assistant'
      const content = role === 'user'
        ? userMessages[Math.floor(Math.random() * userMessages.length)]
        : assistantMessages[Math.floor(Math.random() * assistantMessages.length)]

      await client.query(
        `INSERT INTO "Message" (
          "conversationId", "role", "content", "createdAt"
        ) VALUES ($1, $2, $3, NOW())`,
        [conversationId, role, content]
      )

      messageCount += 1
    }
  }

  return messageCount
}

export default seedMessages
