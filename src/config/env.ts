import dotenv from 'dotenv'

dotenv.config()

export const FALLBACK_WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN as string
export const FALLBACK_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID as string
export const VERIFY_TOKEN = process.env.VERIFY_TOKEN as string
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string
export const PORT = process.env.PORT ? Number(process.env.PORT) : 1999
