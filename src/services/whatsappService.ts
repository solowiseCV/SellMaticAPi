import axios from 'axios'

export async function sendWhatsApp(phoneNumberId: string, accessToken: string, to: string, text: string) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  await axios.post(
    url,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  )
}
