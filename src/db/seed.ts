import pool from './pool'
import seedBusinesses from './seeders/business'
import seedConversations from './seeders/conversation'
import seedMessages from './seeders/message'

async function seed() {
  const client = await pool.connect()

  try {
    console.log('Starting database seed...')
    await client.query('BEGIN')

    console.log('Clearing existing data...')
    await client.query('DELETE FROM "Message"')
    await client.query('DELETE FROM "Conversation"')
    await client.query('DELETE FROM "Business"')
    console.log('Existing data cleared')

    const businessIds = await seedBusinesses(client)
    console.log(`Created ${businessIds.length} businesses`)

    const conversationIds = await seedConversations(client, businessIds)
    console.log(`Created ${conversationIds.length} conversations`)

    const messageCount = await seedMessages(client, conversationIds)
    console.log(`Created ${messageCount} messages`)

    await client.query('COMMIT')
    console.log('Database seed completed successfully')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed error:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
