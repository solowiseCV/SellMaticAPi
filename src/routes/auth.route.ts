import { Router } from 'express'
import { AuthController } from '../controllers/authController'
import { requireAuth } from '../middlewares/authMiddleware'
import { rateLimiter } from '../middlewares/rateLimitMiddleware'

const router = Router()


router.post('/register', rateLimiter(5, 60), AuthController.register)
router.post('/login', rateLimiter(10, 15), AuthController.login)
router.get('/me', requireAuth, AuthController.getMe as any)

export default router
