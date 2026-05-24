import { Router } from 'express'
import { WhatsAppController } from '../controllers/whatsapp.controller'
import { requireAuth } from '../middlewares/authMiddleware'


const router = Router()

router.use(requireAuth)

router.post('/add-number', WhatsAppController.addNumber)
router.post('/verify-number', WhatsAppController.verifyNumber)
router.post('/register-number', WhatsAppController.registerNumber)
router.get('/number-status', WhatsAppController.getNumberStatus)
router.delete('/disconnect', WhatsAppController.disconnectNumber)

export default router