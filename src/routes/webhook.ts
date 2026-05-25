import { Router } from 'express'
import { handleWebhookVerification, handleIncomingWebhook } from '../controllers/webhookController'

const webhookRoutes = Router()

webhookRoutes.get('/', handleWebhookVerification)
webhookRoutes.post('/', handleIncomingWebhook)

export default webhookRoutes
