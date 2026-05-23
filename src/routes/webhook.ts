import { Router } from 'express'
import { handleWebhookVerification, handleIncomingWebhook } from '../controllers/webhookController'

const router = Router()

router.get('/', handleWebhookVerification)
router.post('/', handleIncomingWebhook)

export default router
