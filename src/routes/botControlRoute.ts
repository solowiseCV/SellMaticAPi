import { Router } from 'express'
import { BotControlController } from '../controllers/botControlController'
import { requireAuth } from '../middlewares/authMiddleware'

const botControlRoutes = Router()

botControlRoutes.use(requireAuth)

botControlRoutes.post( '/pause-conversation/:conversationId',BotControlController.pauseConversation)
botControlRoutes.post('/resume-conversation/:conversationId',BotControlController.resumeConversation)

botControlRoutes.post('/pause-global', BotControlController.pauseGlobal)
botControlRoutes.post('/resume-global', BotControlController.resumeGlobal)

botControlRoutes.get('/status', BotControlController.getBotStatus)

export default botControlRoutes