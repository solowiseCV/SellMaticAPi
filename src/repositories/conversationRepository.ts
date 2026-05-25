export async function upsertConversation(client: any, businessId: string, customerPhone: string) {
  const res = await client.query(
    `INSERT INTO "Conversation" ("businessId", "customerPhone", "createdAt", "lastMessageAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT ("businessId", "customerPhone") DO UPDATE SET "lastMessageAt" = NOW()
     RETURNING id`,
    [businessId, customerPhone]
  )
  return res.rows[0].id
}

export async function getRecentMessages(client: any, conversationId: string, limit = 10) {
  const res = await client.query(
    `SELECT role, content FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [conversationId, limit]
  )
  return res.rows.reverse().map((r: any) => ({ role: r.role, content: r.content }))
}


export async function isConversationPaused(
  client: any,
  conversationId: string
): Promise<boolean> {
  const result = await client.query(
    `SELECT "humanTakeover" FROM "Conversation" WHERE id = $1`,
    [conversationId]
  )
  return result.rows[0]?.humanTakeover || false
}