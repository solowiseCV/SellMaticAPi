export async function saveMessage(client: any, conversationId: string, role: string, content: string) {
  await client.query(
    `INSERT INTO "Message" ("conversationId", role, content, "createdAt") VALUES ($1, $2, $3, NOW())`,
    [conversationId, role, content]
  )
}
