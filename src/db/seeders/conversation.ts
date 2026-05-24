import type { PoolClient } from 'pg'

const customerPhones = [
  '+2347012345678',
  '+2347087654321',
  '+2349023456789',
  '+2349081234567',
  '+2348034567890',
  '+2348134567890',
  '+2348148765432',
  '+2348151234567',
  '+2348162345678',
  '+2348173456789'
]

const conversationIntros = [
  'Hello, do you have this product in stock?',
  'Hi! What are your opening hours?',
  'Can you tell me more about this item?',
  'What is the delivery time to my area?',
  'Do you offer a discount for multiple items?',
  'Is this available in my size?'
]

async function seedConversations(client: PoolClient, businessIds: string[]): Promise<string[]> {
  const conversationIds: string[] = []
  let phoneIndex = 0

  for (const businessId of businessIds) {
    for (let i = 0; i < 2; i += 1) {
      const customerPhone = customerPhones[phoneIndex % customerPhones.length]
      const intro = conversationIntros[phoneIndex % conversationIntros.length]

      const result = await client.query(
        `INSERT INTO "Conversation" (
          "businessId", "customerPhone", "createdAt", "lastMessageAt"
        ) VALUES ($1, $2, NOW(), NOW())
        RETURNING id`,
        [businessId, customerPhone]
      )

      conversationIds.push(result.rows[0].id)
      phoneIndex += 1
    }
  }

  return conversationIds
}

export default seedConversations
