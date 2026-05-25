
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const isLocal = process.env.DATABASE_URL?.includes('localhost')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err)
})

export default pool