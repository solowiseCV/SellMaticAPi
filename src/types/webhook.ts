export interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text?: { body: string }
}

export interface WebhookChangeValue {
  metadata?: { phone_number_id?: string }
  messages?: WhatsAppMessage[]
}

export interface WebhookEntryChange {
  value?: WebhookChangeValue
}

export interface WebhookEntry {
  changes?: WebhookEntryChange[]
}

export interface WebhookBody {
  object?: string
  entry?: WebhookEntry[]
}
